import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, shots, characters } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { splitScript } from "@/lib/script-splitter";

// POST /api/projects/:id/split-script — AI-powered script to storyboard
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

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.script || project.script.trim().length === 0) {
    return NextResponse.json(
      { error: "Project has no script. Add a script first." },
      { status: 400 },
    );
  }

  try {
    // Load character data for prompt enrichment
    let characterData: { id: string; name: string; promptTag: string }[] = [];
    if (project.characterIds.length > 0) {
      const chars = await db
        .select()
        .from(characters)
        .where(inArray(characters.id, project.characterIds));

      characterData = chars.map((c) => ({
        id: c.id,
        name: c.name,
        // Use description as promptTag fallback
        promptTag: c.description || c.name,
      }));
    }

    // AI split
    const result = await splitScript(
      project.script,
      project.style,
      characterData,
    );

    // Delete existing shots for this project
    await db.delete(shots).where(eq(shots.projectId, params.id));

    // Insert new shots
    const insertedShots = await db
      .insert(shots)
      .values(
        result.shots.map((shot) => ({
          projectId: params.id,
          order: shot.order,
          description: shot.description,
          duration: shot.duration,
          cameraType: shot.cameraType,
          characterIds: shot.characterIds,
          voiceoverText: shot.voiceover,
        })),
      )
      .returning();

    // Update project status
    await db
      .update(projects)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(projects.id, params.id));

    return NextResponse.json({
      shots: insertedShots,
      totalDuration: result.totalDuration,
      summary: result.summary,
    });
  } catch (err) {
    console.error("[split-script] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to split script", detail: message },
      { status: 500 },
    );
  }
}
