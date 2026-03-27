import { NextResponse } from "next/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { analyzeCharacterImage } from "@/lib/character-analysis";

// POST /api/characters/:id/analyze — AI feature extraction from reference image
export async function POST(
  _request: Request,
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
    .where(
      and(eq(characters.id, params.id), eq(characters.userId, user.id)),
    )
    .limit(1);

  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (character.referenceImages.length === 0) {
    return NextResponse.json(
      { error: "No reference images uploaded" },
      { status: 400 },
    );
  }

  // Analyze the first reference image
  const features = await analyzeCharacterImage(character.referenceImages[0]);

  // Update character description with AI-generated analysis
  const [updated] = await db
    .update(characters)
    .set({
      description: features.overallDescription,
    })
    .where(eq(characters.id, params.id))
    .returning();

  return NextResponse.json({
    character: updated,
    features,
  });
}
