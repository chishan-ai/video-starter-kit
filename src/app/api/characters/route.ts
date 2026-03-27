import { NextResponse } from "next/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.string().optional(),
  description: z.string().default(""),
  referenceImages: z.array(z.string()).default([]),
  thumbnailUrl: z.string().optional(),
});

// GET /api/characters
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, user.id))
    .orderBy(desc(characters.createdAt));

  return NextResponse.json(result);
}

// POST /api/characters
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCharacterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [character] = await db
    .insert(characters)
    .values({
      userId: user.id,
      ...parsed.data,
    })
    .returning();

  return NextResponse.json(character, { status: 201 });
}
