import { db } from "@/db";
import { characters, projects, shots } from "@/db/schema";
import { CREDIT_COSTS, addCredits, deductCredits } from "@/lib/credits";
import {
  type VideoModelKey,
  falServer,
  getModelEndpoint,
  isReferenceModel,
} from "@/lib/fal-server";
import {
  composeReferenceVideoPrompt,
  composeVideoPrompt,
} from "@/lib/prompt-composer";
import { buildReferenceVideoInput } from "@/lib/prompt-enhancer";
import { eq, inArray } from "drizzle-orm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PipelineCharacter {
  id: string;
  name: string;
  description: string;
  accessories: { type: string; description: string; imageUrl?: string }[];
  referenceImages: {
    url: string;
    angle: "front" | "right" | "back" | "left" | "custom";
    label?: string;
  }[];
}

export interface PipelineShot {
  id: string;
  description: string;
  cameraType: string;
  characterIds: string[];
  narrativeIntent: string | null;
}

export interface PipelineProject {
  id: string;
  style: string;
}

export interface PipelineParams {
  userId: string;
  projectId: string;
  modelKey: string;
  shots: PipelineShot[];
  project: PipelineProject;
}

export interface JobResult {
  shotId: string;
  requestId?: string;
  model?: string;
  error?: string;
}

export interface PipelineResult {
  submitted: number;
  failed: number;
  jobs: JobResult[];
}

export async function generateShotsPipeline(
  params: PipelineParams,
): Promise<PipelineResult> {
  const { userId, projectId, modelKey, shots: pendingShots, project } = params;
  const isRef = isReferenceModel(modelKey);
  const isImageToVideo = modelKey.endsWith("-i2v");
  const creditCost =
    CREDIT_COSTS[modelKey as keyof typeof CREDIT_COSTS] ??
    CREDIT_COSTS["vidu-q3-i2v"];

  // Batch-load all referenced characters
  const allCharacterIds = Array.from(
    new Set(pendingShots.flatMap((s) => s.characterIds)),
  ).filter((id) => UUID_RE.test(id));

  const charMap = new Map<string, PipelineCharacter>();

  if (allCharacterIds.length > 0) {
    const chars = await db
      .select()
      .from(characters)
      .where(inArray(characters.id, allCharacterIds));
    for (const c of chars) {
      charMap.set(c.id, {
        id: c.id,
        name: c.name,
        description: c.description,
        accessories: c.accessories,
        referenceImages: c.referenceImages,
      });
    }
  }

  const jobs: JobResult[] = [];

  await Promise.all(
    pendingShots.map(async (shot) => {
      // Deduct credits atomically
      const deduction = await deductCredits(
        userId,
        creditCost,
        "generation",
        `Batch generation: ${modelKey}`,
        shot.id,
      );

      if (!deduction.success) {
        jobs.push({ shotId: shot.id, error: "Insufficient credits" });
        return;
      }

      const validCharIds = shot.characterIds.filter((id) => UUID_RE.test(id));
      const shotChars = validCharIds
        .map((id) => charMap.get(id))
        .filter((c): c is PipelineCharacter => !!c);

      let endpoint: string;
      let input: Record<string, unknown>;
      let actualModelKey = modelKey;

      if (isRef && shotChars.length > 0) {
        // Reference-to-video path
        const provider = modelKey.startsWith("kling") ? "kling" : "vidu";
        const enhancedPrompt = composeReferenceVideoPrompt({
          shotDescription: shot.description,
          style: project.style,
          cameraType: shot.cameraType,
          characters: shotChars.map((c) => ({
            name: c.name,
            description: c.description,
          })),
          provider,
          narrativeIntent: shot.narrativeIntent ?? undefined,
        });

        endpoint = getModelEndpoint(modelKey as VideoModelKey);
        input = {
          prompt: enhancedPrompt,
          ...buildReferenceVideoInput(provider, shotChars),
        };
      } else {
        // Standard i2v / t2v path
        const characterTags = shotChars
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

        const enhancedPrompt = composeVideoPrompt({
          shotDescription: shot.description,
          style: project.style,
          cameraType: shot.cameraType,
          characterTags,
          narrativeIntent: shot.narrativeIntent ?? undefined,
        });

        // Get reference image for i2v
        let imageUrl: string | undefined;
        if (isImageToVideo && shotChars.length > 0) {
          const char = shotChars[0];
          if (char.referenceImages.length > 0) {
            imageUrl = char.referenceImages[0].url;
          }
        }

        // Fall back to t2v if i2v but no image
        actualModelKey =
          isImageToVideo && !imageUrl
            ? modelKey.replace("-i2v", "-t2v")
            : modelKey;
        endpoint = getModelEndpoint(actualModelKey as VideoModelKey);
        input = { prompt: enhancedPrompt };
        if (isImageToVideo && imageUrl) {
          input.image_url = imageUrl;
        }
      }

      try {
        const { request_id } = await falServer.queue.submit(endpoint, {
          input,
        });

        // BUG FIX: update pendingRequestId AND pendingModel
        await db
          .update(shots)
          .set({
            status: "generating",
            pendingRequestId: request_id,
            pendingModel: actualModelKey,
          })
          .where(eq(shots.id, shot.id));

        jobs.push({
          shotId: shot.id,
          requestId: request_id,
          model: actualModelKey,
        });
      } catch (error) {
        // Refund on failure
        await addCredits(
          userId,
          creditCost,
          "refund",
          "Refund: batch generation failed",
          shot.id,
        );
        jobs.push({
          shotId: shot.id,
          error: error instanceof Error ? error.message : "Submit failed",
        });
      }
    }),
  );

  const submitted = jobs.filter((j) => j.requestId).length;
  const failed = jobs.filter((j) => j.error).length;

  // BUG FIX: only mark project "generating" if at least 1 submission succeeded
  if (submitted > 0) {
    await db
      .update(projects)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(projects.id, projectId));
  }

  return { submitted, failed, jobs };
}
