import { NextResponse } from "next/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { falServer, getImageEndpoint, extractImageUrl } from "@/lib/fal-server";
import { STYLE_MODIFIERS } from "@/lib/prompt-enhancer";
import { z } from "zod";

const designSchema = z.object({
  style: z.enum(["anime", "realistic", "3d"]).default("anime"),
  generateSheet: z.boolean().default(true),
});

// POST /api/characters/:id/generate-design
// Generate character main image + character sheet from description
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

  const [character] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.id, params.id), eq(characters.userId, user.id)))
    .limit(1);

  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!character.description || character.description.trim().length === 0) {
    return NextResponse.json(
      { error: "Character description is required to generate design" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = designSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { style, generateSheet } = parsed.data;
  const creditCost = CREDIT_COSTS["character-design"];

  const deduction = await deductCredits(
    user.id,
    creditCost,
    "generation",
    `Character design: ${character.name}`,
    character.id,
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

  const styleModifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.anime;

  try {
    // Step 1: Generate main character image (full body, front view)
    const mainPrompt = `Full body character design, front view, neutral pose, ${character.description}, ${styleModifier}, white background, character concept art, high quality`;

    const mainImageUrl = extractImageUrl(
      await falServer.subscribe(getImageEndpoint("flux-2-pro"), {
        input: { prompt: mainPrompt, image_size: "portrait_4_3", num_images: 1 },
      }),
    );

    let sheetUrl: string | undefined;
    if (generateSheet) {
      const sheetPrompt = `Character sheet, character turnaround, multiple views, front view, side view, back view, three-quarter view, ${character.description}, ${styleModifier}, white background, character reference sheet, professional concept art`;

      try {
        sheetUrl = extractImageUrl(
          await falServer.subscribe(getImageEndpoint("flux-2-pro"), {
            input: { prompt: sheetPrompt, image_size: "landscape_16_9", num_images: 1 },
          }),
        );
      } catch {
        // Sheet generation is optional — continue with main image only
      }
    }

    // Update character with generated images
    const updatedRefs = [mainImageUrl, ...character.referenceImages];
    const [updated] = await db
      .update(characters)
      .set({
        referenceImages: updatedRefs,
        thumbnailUrl: mainImageUrl,
        characterSheetUrl: sheetUrl ?? character.characterSheetUrl,
      })
      .where(eq(characters.id, params.id))
      .returning();

    return NextResponse.json({
      character: updated,
      mainImageUrl,
      characterSheetUrl: sheetUrl,
      creditsUsed: creditCost,
      balance: deduction.balance,
    });
  } catch (error) {
    // Refund on failure
    const { addCredits } = await import("@/lib/credits");
    await addCredits(
      user.id,
      creditCost,
      "refund",
      `Refund: character design failed for ${character.name}`,
      character.id,
    );

    const message =
      error instanceof Error ? error.message : "Design generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
