import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, shots, shotVersions, characters } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { buildVideoPrompt, buildReferenceVideoPrompt, buildReferenceVideoInput } from "@/lib/prompt-enhancer";
import {
  falServer,
  getModelEndpoint,
  isReferenceModel,
  type VideoModelKey,
} from "@/lib/fal-server";
import { z } from "zod";

const generateSchema = z.object({
  model: z
    .enum([
      "vidu-q3-i2v", "vidu-q3-t2v", "kling-3-pro-i2v", "kling-3-pro-t2v",
      "kling-o1-ref", "vidu-q1-ref", "vidu-q2-ref",
    ])
    .default("vidu-q3-i2v"),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/projects/:id/shots/:shotId/generate-video
export async function POST(
  request: Request,
  { params }: { params: { id: string; shotId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get the shot
  const [shot] = await db
    .select()
    .from(shots)
    .where(and(eq(shots.id, params.shotId), eq(shots.projectId, params.id)))
    .limit(1);

  if (!shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  // Parse model selection
  const body = await request.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const modelKey = parsed.data.model;
  const isRef = isReferenceModel(modelKey);

  // Deduct credits
  const creditCost = isRef
    ? CREDIT_COSTS[modelKey as keyof typeof CREDIT_COSTS]
    : (CREDIT_COSTS[modelKey as keyof typeof CREDIT_COSTS] ??
       CREDIT_COSTS["vidu-q3-i2v"]);

  const deduction = await deductCredits(
    user.id,
    creditCost,
    "generation",
    `Video generation: ${modelKey}`,
    shot.id,
  );

  if (!deduction.success) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        balance: deduction.balance,
        required: creditCost,
      },
      { status: 402 },
    );
  }

  // Filter to valid UUIDs only (AI may generate placeholder IDs like "kitten-01")
  const validCharacterIds = shot.characterIds.filter((id) => UUID_RE.test(id));

  // Load character data (used for both prompt tags and reference images)
  let charData: { id: string; name: string; description: string; accessories: { type: string; description: string; imageUrl?: string }[]; referenceImages: { url: string; angle: "front" | "right" | "back" | "left" | "custom"; label?: string }[] }[] = [];
  if (validCharacterIds.length > 0) {
    charData = await db
      .select()
      .from(characters)
      .where(inArray(characters.id, validCharacterIds));
  }
  const characterTags = charData
    .map((c) => {
      const parts = [c.description].filter(Boolean);
      if (c.accessories?.length > 0) {
        parts.push(
          `wearing ${c.accessories.map((a) => a.description).join(", ")}`,
        );
      }
      return parts.join(", ");
    })
    .filter((d) => d.length > 0);

  let endpoint: string;
  let input: Record<string, unknown>;
  let actualModelKey = modelKey;

  if (isRef && charData.length > 0) {
    // ── Reference-to-video path ──
    const provider = modelKey.startsWith("kling") ? "kling" : "vidu";
    const enhancedPrompt = buildReferenceVideoPrompt({
      shotDescription: shot.description,
      style: project.style,
      cameraType: shot.cameraType,
      characters: charData.map((c) => ({ name: c.name, description: c.description })),
      provider,
    });

    endpoint = getModelEndpoint(modelKey as VideoModelKey);
    input = { prompt: enhancedPrompt, ...buildReferenceVideoInput(provider, charData) };
  } else {
    // ── Standard i2v / t2v path ──
    const isImageToVideo = modelKey.endsWith("-i2v");
    const enhancedPrompt = buildVideoPrompt({
      shotDescription: shot.description,
      style: project.style,
      cameraType: shot.cameraType,
      characterTags,
    });

    // Get character reference image for i2v
    let imageUrl: string | undefined;
    if (isImageToVideo && charData.length > 0) {
      const char = charData[0];
      if (char.referenceImages.length > 0) {
        imageUrl = char.referenceImages[0].url;
      }
    }

    // Fall back to t2v if i2v requested but no image available
    actualModelKey = isImageToVideo && !imageUrl
      ? (modelKey.replace("-i2v", "-t2v") as VideoModelKey)
      : modelKey;
    endpoint = getModelEndpoint(actualModelKey as VideoModelKey);
    input = { prompt: enhancedPrompt };
    if (isImageToVideo && imageUrl) {
      input.image_url = imageUrl;
    }
  }

  try {
    // Use queue.submit for async generation
    const { request_id } = await falServer.queue.submit(endpoint, {
      input,
    });

    // Mark shot as generating with tracking info
    await db
      .update(shots)
      .set({
        status: "generating",
        pendingRequestId: request_id,
        pendingModel: actualModelKey,
      })
      .where(eq(shots.id, params.shotId));

    return NextResponse.json({
      requestId: request_id,
      shotId: shot.id,
      model: actualModelKey,
      prompt: input.prompt as string,
      creditsUsed: creditCost,
      balance: deduction.balance,
    });
  } catch (error) {
    // Refund credits on submission failure
    const { addCredits } = await import("@/lib/credits");
    await addCredits(
      user.id,
      creditCost,
      "refund",
      `Refund: generation failed for ${modelKey}`,
      shot.id,
    );

    // Reset shot status
    await db
      .update(shots)
      .set({ status: "pending" })
      .where(eq(shots.id, params.shotId));

    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
