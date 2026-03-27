import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, shots, characters } from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, CREDIT_COSTS, getBalance } from "@/lib/credits";
import { buildVideoPrompt } from "@/lib/prompt-enhancer";
import { falServer, getModelEndpoint } from "@/lib/fal-server";
import { z } from "zod";

const generateAllSchema = z.object({
  model: z
    .enum(["vidu-q3-i2v", "vidu-q3-t2v", "kling-3-pro-i2v", "kling-3-pro-t2v"])
    .default("vidu-q3-i2v"),
});

// POST /api/projects/:id/generate-all — generate video for all pending shots
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = generateAllSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const modelKey = parsed.data.model;
  const isImageToVideo = modelKey.endsWith("-i2v");
  const endpoint = getModelEndpoint(modelKey);
  const creditCost =
    CREDIT_COSTS[`${modelKey}` as keyof typeof CREDIT_COSTS] ??
    CREDIT_COSTS["vidu-q3-i2v"];

  // Get pending shots
  const pendingShots = await db
    .select()
    .from(shots)
    .where(and(eq(shots.projectId, params.id), eq(shots.status, "pending")))
    .orderBy(asc(shots.order));

  if (pendingShots.length === 0) {
    return NextResponse.json({ error: "No pending shots" }, { status: 400 });
  }

  // Check total credits needed
  const totalCost = creditCost * pendingShots.length;
  const balance = await getBalance(user.id);
  if (balance < totalCost) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        balance,
        required: totalCost,
        shotCount: pendingShots.length,
      },
      { status: 402 },
    );
  }

  // Collect all character IDs from shots
  const allCharacterIds = Array.from(
    new Set(pendingShots.flatMap((s) => s.characterIds)),
  );
  let charMap = new Map<
    string,
    { description: string; referenceImages: string[] }
  >();
  if (allCharacterIds.length > 0) {
    const chars = await db
      .select()
      .from(characters)
      .where(inArray(characters.id, allCharacterIds));
    for (const c of chars) {
      charMap.set(c.id, {
        description: c.description,
        referenceImages: c.referenceImages,
      });
    }
  }

  // Submit all shots in parallel
  const jobs: {
    shotId: string;
    requestId?: string;
    error?: string;
  }[] = [];

  await Promise.all(
    pendingShots.map(async (shot) => {
      // Deduct credits
      const deduction = await deductCredits(
        user.id,
        creditCost,
        "generation",
        `Batch generation: ${modelKey}`,
        shot.id,
      );

      if (!deduction.success) {
        jobs.push({ shotId: shot.id, error: "Insufficient credits" });
        return;
      }

      // Build prompt
      const characterTags = shot.characterIds
        .map((id) => charMap.get(id)?.description)
        .filter((d): d is string => !!d);

      const enhancedPrompt = buildVideoPrompt({
        shotDescription: shot.description,
        style: project.style,
        cameraType: shot.cameraType,
        characterTags,
      });

      // Get reference image
      let imageUrl: string | undefined;
      if (isImageToVideo && shot.characterIds.length > 0) {
        const charData = charMap.get(shot.characterIds[0]);
        if (charData && charData.referenceImages.length > 0) {
          imageUrl = charData.referenceImages[0];
        }
      }

      const input: Record<string, unknown> = { prompt: enhancedPrompt };
      if (isImageToVideo && imageUrl) {
        input.image_url = imageUrl;
      }

      try {
        const { request_id } = await falServer.queue.submit(endpoint, {
          input,
        });

        await db
          .update(shots)
          .set({ status: "generating" })
          .where(eq(shots.id, shot.id));

        jobs.push({ shotId: shot.id, requestId: request_id });
      } catch (error) {
        // Refund on failure
        const { addCredits } = await import("@/lib/credits");
        await addCredits(
          user.id,
          creditCost,
          "refund",
          `Refund: batch generation failed`,
          shot.id,
        );
        jobs.push({
          shotId: shot.id,
          error: error instanceof Error ? error.message : "Submit failed",
        });
      }
    }),
  );

  // Update project status
  await db
    .update(projects)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(projects.id, params.id));

  const submitted = jobs.filter((j) => j.requestId);
  const failed = jobs.filter((j) => j.error);

  return NextResponse.json({
    model: modelKey,
    submitted: submitted.length,
    failed: failed.length,
    jobs,
  });
}
