import { db } from "@/db";
import { characters, projects, shots } from "@/db/schema";
import { splitScript } from "@/lib/script-splitter";
import { createClient } from "@/lib/supabase/server";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/projects/:id/split-script — AI-powered script to storyboard
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

  const mode = new URL(request.url).searchParams.get("mode") || "commit";

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

    // Preview mode: return suggestions without writing to DB
    if (mode === "preview") {
      const CREDITS_PER_SHOT = 10; // vidu-q3-i2v default cost
      return NextResponse.json({
        shots: result.shots,
        totalDuration: result.totalDuration,
        summary: result.summary,
        scriptType: result.scriptType,
        costEstimate: {
          shotCount: result.shots.length,
          creditsPerShot: CREDITS_PER_SHOT,
          totalCredits: result.shots.length * CREDITS_PER_SHOT,
        },
      });
    }

    // Commit mode (default): delete old shots and insert new ones
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
          characterIds: shot.characterIds.filter((id) => UUID_RE.test(id)),
          voiceoverText: shot.voiceover,
          narrativeIntent: shot.narrativeIntent,
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
      scriptType: result.scriptType,
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
