import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots, projects } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createShotSchema = z.object({
  description: z.string().default(""),
  duration: z.number().int().min(3).max(10).default(4),
  cameraType: z
    .enum(["wide", "medium", "close-up", "overhead", "low-angle"])
    .default("medium"),
  characterIds: z.array(z.string()).default([]),
  order: z.number().int().optional(),
});

async function verifyProjectOwnership(projectId: string, userId: string) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project;
}

// GET /api/projects/:id/shots
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

  const project = await verifyProjectOwnership(params.id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = await db
    .select()
    .from(shots)
    .where(eq(shots.projectId, params.id))
    .orderBy(asc(shots.order));

  return NextResponse.json(result);
}

// POST /api/projects/:id/shots
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

  const project = await verifyProjectOwnership(params.id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createShotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Auto-assign order if not provided
  let order = parsed.data.order;
  if (order === undefined) {
    const existing = await db
      .select({ order: shots.order })
      .from(shots)
      .where(eq(shots.projectId, params.id))
      .orderBy(asc(shots.order));
    order = existing.length > 0 ? existing[existing.length - 1].order + 1 : 0;
  }

  const [shot] = await db
    .insert(shots)
    .values({
      projectId: params.id,
      ...parsed.data,
      order,
    })
    .returning();

  return NextResponse.json(shot, { status: 201 });
}
