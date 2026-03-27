import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateShotSchema = z.object({
  description: z.string().optional(),
  duration: z.number().int().min(3).max(10).optional(),
  cameraType: z
    .enum(["wide", "medium", "close-up", "overhead", "low-angle"])
    .optional(),
  characterIds: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  status: z.enum(["pending", "generating", "completed", "failed"]).optional(),
  selectedVersionId: z.string().nullable().optional(),
  voiceoverText: z.string().nullable().optional(),
  ttsAudioUrl: z.string().nullable().optional(),
});

async function verifyProjectOwnership(projectId: string, userId: string) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project;
}

// GET /api/projects/:id/shots/:shotId
export async function GET(
  _request: Request,
  { params }: { params: { id: string; shotId: string } },
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

  const [shot] = await db
    .select()
    .from(shots)
    .where(and(eq(shots.id, params.shotId), eq(shots.projectId, params.id)))
    .limit(1);

  if (!shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  return NextResponse.json(shot);
}

// PATCH /api/projects/:id/shots/:shotId
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; shotId: string } },
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
  const parsed = updateShotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(shots)
    .set(parsed.data)
    .where(and(eq(shots.id, params.shotId), eq(shots.projectId, params.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/projects/:id/shots/:shotId
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; shotId: string } },
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

  const [deleted] = await db
    .delete(shots)
    .where(and(eq(shots.id, params.shotId), eq(shots.projectId, params.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
