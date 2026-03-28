import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { falServer, getMusicEndpoint } from "@/lib/fal-server";

// POST /api/projects/:id/music-status
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

  if (!project.musicRequestId) {
    return NextResponse.json({ error: "No pending music generation" }, { status: 400 });
  }

  // If music URL already set, return immediately
  if (project.musicUrl) {
    return NextResponse.json({ status: "completed", musicUrl: project.musicUrl });
  }

  const endpoint = getMusicEndpoint("minimax-music");

  try {
    const status = await falServer.queue.status(endpoint, {
      requestId: project.musicRequestId,
      logs: false,
    });

    if (status.status === "COMPLETED") {
      const result = await falServer.queue.result(endpoint, {
        requestId: project.musicRequestId,
      });
      const data = result.data as Record<string, unknown>;

      const audioUrl =
        (data.audio_file as { url: string } | undefined)?.url ??
        (data.audio as { url: string } | undefined)?.url ??
        (data.audio_url as string | undefined);

      if (audioUrl) {
        await db
          .update(projects)
          .set({
            musicUrl: typeof audioUrl === "string" ? audioUrl : String(audioUrl),
            musicRequestId: null,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, params.id));

        return NextResponse.json({ status: "completed", musicUrl: audioUrl });
      }
    }

    if ((status as { status: string }).status === "FAILED") {
      await db
        .update(projects)
        .set({ musicRequestId: null, updatedAt: new Date() })
        .where(eq(projects.id, params.id));

      return NextResponse.json({ status: "failed", error: "Music generation failed" });
    }

    return NextResponse.json({ status: "generating" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ status: "error", error: message });
  }
}
