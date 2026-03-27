import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots, shotVersions, projects } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import {
  falServer,
  VIDEO_MODELS,
  type VideoModelKey,
} from "@/lib/fal-server";
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

  const rows = await db
    .select({
      shot: shots,
      videoUrl: shotVersions.videoUrl,
    })
    .from(shots)
    .leftJoin(shotVersions, eq(shots.selectedVersionId, shotVersions.id))
    .where(eq(shots.projectId, params.id))
    .orderBy(asc(shots.order));

  const result = rows.map((r) => ({
    ...r.shot,
    videoUrl: r.videoUrl ?? null,
  }));

  // Auto-check fal.ai status for generating shots (lazy polling)
  const generatingShots = result.filter(
    (s) => s.status === "generating" && s.pendingRequestId && s.pendingModel,
  );
  if (generatingShots.length > 0) {
    await Promise.allSettled(
      generatingShots.map(async (shot) => {
        try {
          const endpoint =
            (VIDEO_MODELS as Record<string, string>)[shot.pendingModel!] ??
            shot.pendingModel!;
          const status = await falServer.queue.status(endpoint, {
            requestId: shot.pendingRequestId!,
            logs: false,
          });

          if (status.status === "COMPLETED") {
            const res = await falServer.queue.result(endpoint, {
              requestId: shot.pendingRequestId!,
            });
            const data = res.data as Record<string, unknown>;
            const video = data.video as
              | { url: string }
              | undefined;

            if (video?.url) {
              const [version] = await db
                .insert(shotVersions)
                .values({
                  shotId: shot.id,
                  videoUrl: video.url,
                  prompt: "",
                  model: endpoint,
                  externalTaskId: shot.pendingRequestId,
                })
                .returning();

              await db
                .update(shots)
                .set({
                  status: "completed",
                  selectedVersionId: version.id,
                  pendingRequestId: null,
                  pendingModel: null,
                })
                .where(eq(shots.id, shot.id));

              // Update in-memory result
              const idx = result.findIndex((s) => s.id === shot.id);
              if (idx >= 0) {
                result[idx] = { ...result[idx], status: "completed", selectedVersionId: version.id, pendingRequestId: null, pendingModel: null };
              }
            }
          } else if ((status as { status: string }).status === "FAILED") {
            await db
              .update(shots)
              .set({ status: "failed", pendingRequestId: null, pendingModel: null })
              .where(eq(shots.id, shot.id));
            const idx = result.findIndex((s) => s.id === shot.id);
            if (idx >= 0) {
              result[idx] = { ...result[idx], status: "failed", pendingRequestId: null, pendingModel: null };
            }
          }
        } catch {
          // Silently skip status check failures
        }
      }),
    );
  }

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
