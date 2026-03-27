import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots, shotVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import {
  falServer,
  isTtsModel,
  VIDEO_MODELS,
  TTS_MODELS,
  type VideoModelKey,
  type TtsModelKey,
} from "@/lib/fal-server";
import { z } from "zod";

const statusSchema = z.object({
  requestId: z.string(),
  shotId: z.string(),
  model: z.string(),
});

// POST /api/generation/status — check fal.ai job status
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { requestId, shotId, model } = parsed.data;

  // Resolve internal model key to fal.ai endpoint if needed
  const endpoint =
    (VIDEO_MODELS as Record<string, string>)[model] ??
    (TTS_MODELS as Record<string, string>)[model] ??
    model;

  try {
    const status = await falServer.queue.status(endpoint, {
      requestId,
      logs: false,
    });

    if (status.status === "COMPLETED") {
      // Fetch the result
      const result = await falServer.queue.result(endpoint, { requestId });
      const data = result.data as Record<string, unknown>;

      // Handle TTS results
      if (isTtsModel(model.replace("fal-ai/", "")) || model.includes("tts")) {
        const audioUrl =
          (data.audio_url as { url: string } | undefined)?.url ??
          (data.audio as { url: string } | undefined)?.url ??
          (data.audio_url as string | undefined);

        if (audioUrl) {
          await db
            .update(shots)
            .set({
              ttsAudioUrl:
                typeof audioUrl === "string" ? audioUrl : String(audioUrl),
            })
            .where(eq(shots.id, shotId));

          return NextResponse.json({
            status: "completed",
            audioUrl,
          });
        }
      }

      // Handle video results
      const video = data.video as
        | { url: string; file_size?: number }
        | undefined;

      if (video?.url) {
        // Create ShotVersion record
        const [version] = await db
          .insert(shotVersions)
          .values({
            shotId,
            videoUrl: video.url,
            prompt: "",
            model,
            externalTaskId: requestId,
          })
          .returning();

        // Update shot status and select this version
        await db
          .update(shots)
          .set({
            status: "completed",
            selectedVersionId: version.id,
          })
          .where(eq(shots.id, shotId));

        return NextResponse.json({
          status: "completed",
          version,
          videoUrl: video.url,
        });
      }
    }

    if ((status as { status: string }).status === "FAILED") {
      await db
        .update(shots)
        .set({ status: "failed" })
        .where(eq(shots.id, shotId));

      return NextResponse.json({
        status: "failed",
        error: "Generation failed",
      });
    }

    // Still in progress
    return NextResponse.json({
      status: "generating",
      queuePosition: (status as unknown as Record<string, unknown>)
        .queue_position,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ status: "error", error: message });
  }
}
