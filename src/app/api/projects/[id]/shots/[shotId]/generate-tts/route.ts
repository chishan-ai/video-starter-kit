import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, shots } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, addCredits, CREDIT_COSTS } from "@/lib/credits";
import { falServer, getTtsEndpoint, type TtsModelKey } from "@/lib/fal-server";
import { z } from "zod";

const ttsSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  model: z.enum(["f5-tts", "playht-v3"]).default("f5-tts"),
});

// POST /api/projects/:id/shots/:shotId/generate-tts
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

  const body = await request.json();
  const parsed = ttsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Use provided text or fall back to shot's voiceover text
  const ttsText = parsed.data.text || shot.voiceoverText;
  if (!ttsText) {
    return NextResponse.json(
      { error: "No voiceover text. Add voiceover text to the shot first." },
      { status: 400 },
    );
  }

  const modelKey = parsed.data.model;
  const creditCost = CREDIT_COSTS["f5-tts"];

  // Deduct credits
  const deduction = await deductCredits(
    user.id,
    creditCost,
    "generation",
    `TTS generation: ${modelKey}`,
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

  // Build TTS input based on model
  const endpoint = getTtsEndpoint(modelKey);
  let input: Record<string, unknown>;

  if (modelKey === "f5-tts") {
    input = {
      gen_text: ttsText,
      ref_audio_url:
        "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
      ref_text: "Some call me nature, others call me mother nature.",
      model_type: "F5-TTS",
      remove_silence: true,
    };
  } else {
    input = {
      input: ttsText,
      voice: "Dexter (English (US)/American)",
    };
  }

  // Update voiceover text if a new one was provided
  if (parsed.data.text && parsed.data.text !== shot.voiceoverText) {
    await db
      .update(shots)
      .set({ voiceoverText: parsed.data.text })
      .where(eq(shots.id, params.shotId));
  }

  try {
    const { request_id } = await falServer.queue.submit(endpoint, { input });

    return NextResponse.json({
      requestId: request_id,
      shotId: shot.id,
      model: endpoint,
      creditsUsed: creditCost,
      balance: deduction.balance,
    });
  } catch (error) {
    // Refund on failure
    await addCredits(
      user.id,
      creditCost,
      "refund",
      `Refund: TTS failed for ${modelKey}`,
      shot.id,
    );

    const message =
      error instanceof Error ? error.message : "TTS generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
