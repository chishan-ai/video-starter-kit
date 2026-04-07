import { NextResponse } from "next/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.string().optional(),
  description: z.string().optional(),
  outfitDescription: z.string().nullable().optional(),
  referenceImages: z.array(z.string()).optional(),
  thumbnailUrl: z.string().nullable().optional(),
});

// GET /api/characters/:id
export async function GET(
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
    .where(and(eq(characters.id, params.id), eq(characters.userId, user.id)))
    .limit(1);

  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(character);
}

// PATCH /api/characters/:id
export async function PATCH(
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

  const body = await request.json();
  const parsed = updateCharacterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { referenceImages: rawImages, ...rest } = parsed.data;
  const setData: Record<string, unknown> = { ...rest };
  if (rawImages) {
    setData.referenceImages = rawImages.map((url) => ({ url, angle: "custom" as const }));
  }
  const [updated] = await db
    .update(characters)
    .set(setData)
    .where(and(eq(characters.id, params.id), eq(characters.userId, user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/characters/:id
export async function DELETE(
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

  const [deleted] = await db
    .delete(characters)
    .where(and(eq(characters.id, params.id), eq(characters.userId, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
