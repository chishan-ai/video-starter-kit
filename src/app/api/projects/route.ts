import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  style: z.enum(["anime", "realistic", "3d", "mixed"]).default("anime"),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
});

// GET /api/projects — list user's projects
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
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json(result);
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [project] = await db
    .insert(projects)
    .values({
      userId: user.id,
      name: parsed.data.name,
      style: parsed.data.style,
      aspectRatio: parsed.data.aspectRatio,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
