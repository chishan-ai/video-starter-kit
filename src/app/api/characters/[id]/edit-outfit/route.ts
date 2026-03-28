import { NextResponse } from "next/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { falServer, getImageEndpoint, extractImageUrl } from "@/lib/fal-server";
import { z } from "zod";

const editOutfitSchema = z.object({
  instruction: z.string().min(5).max(500),
  model: z.enum(["flux-kontext-pro", "flux-kontext-max"]).default("flux-kontext-pro"),
});

// POST /api/characters/:id/edit-outfit
// Edit character outfit/accessories using Flux Kontext (instruction-based editing)
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

  if (character.referenceImages.length === 0) {
    return NextResponse.json(
      { error: "Character must have at least one reference image to edit" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = editOutfitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { instruction, model } = parsed.data;
  const creditCost = CREDIT_COSTS[model];

  const deduction = await deductCredits(
    user.id,
    creditCost,
    "generation",
    `Outfit edit: ${character.name} — ${instruction.slice(0, 50)}`,
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

  try {
    // Use Flux Kontext to edit the character's outfit
    // Kontext preserves character identity while changing clothing/accessories
    const editedImageUrl = extractImageUrl(
      await falServer.subscribe(getImageEndpoint(model), {
        input: {
          prompt: instruction,
          image_url: character.referenceImages[0],
        },
      }),
    );

    // Add edited image to reference images (prepend so it becomes the primary)
    const updatedRefs = [editedImageUrl, ...character.referenceImages];
    const [updated] = await db
      .update(characters)
      .set({
        referenceImages: updatedRefs,
        thumbnailUrl: editedImageUrl,
        outfitDescription: instruction,
      })
      .where(eq(characters.id, params.id))
      .returning();

    return NextResponse.json({
      character: updated,
      editedImageUrl,
      creditsUsed: creditCost,
      balance: deduction.balance,
    });
  } catch (error) {
    const { addCredits } = await import("@/lib/credits");
    await addCredits(
      user.id,
      creditCost,
      "refund",
      `Refund: outfit edit failed for ${character.name}`,
      character.id,
    );

    const message =
      error instanceof Error ? error.message : "Outfit edit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
