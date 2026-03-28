import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots, shotVersions, projects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/:id/shots/:shotId/versions
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

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify shot belongs to project
  const [shot] = await db
    .select({ id: shots.id })
    .from(shots)
    .where(and(eq(shots.id, params.shotId), eq(shots.projectId, params.id)))
    .limit(1);

  if (!shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  const versions = await db
    .select()
    .from(shotVersions)
    .where(eq(shotVersions.shotId, params.shotId))
    .orderBy(desc(shotVersions.generatedAt))
    .limit(20);

  return NextResponse.json(versions);
}
