import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  style: z.enum(["anime", "realistic", "3d", "mixed"]).optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
  status: z.enum(["draft", "generating", "completed", "exported"]).optional(),
  script: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
});

// GET /api/projects/:id
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

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/:id
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
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/projects/:id
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
    .delete(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
