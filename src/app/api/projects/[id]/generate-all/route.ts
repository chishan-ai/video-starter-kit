import { db } from "@/db";
import { projects, shots } from "@/db/schema";
import { CREDIT_COSTS, getBalance } from "@/lib/credits";
import { generateShotsPipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";
import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const generateAllSchema = z.object({
  model: z
    .enum(["vidu-q3-i2v", "vidu-q3-t2v", "kling-3-pro-i2v", "kling-3-pro-t2v"])
    .default("vidu-q3-i2v"),
});

// POST /api/projects/:id/generate-all — generate video for all pending shots
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

  const body = await request.json();
  const parsed = generateAllSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const modelKey = parsed.data.model;
  const creditCost =
    CREDIT_COSTS[`${modelKey}` as keyof typeof CREDIT_COSTS] ??
    CREDIT_COSTS["vidu-q3-i2v"];

  // Get pending shots
  const pendingShots = await db
    .select()
    .from(shots)
    .where(and(eq(shots.projectId, params.id), eq(shots.status, "pending")))
    .orderBy(asc(shots.order));

  if (pendingShots.length === 0) {
    return NextResponse.json({ error: "No pending shots" }, { status: 400 });
  }

  // Check total credits needed
  const totalCost = creditCost * pendingShots.length;
  const balance = await getBalance(user.id);
  if (balance < totalCost) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        balance,
        required: totalCost,
        shotCount: pendingShots.length,
      },
      { status: 402 },
    );
  }

  const result = await generateShotsPipeline({
    userId: user.id,
    projectId: params.id,
    modelKey,
    shots: pendingShots,
    project: { id: project.id, style: project.style },
  });

  return NextResponse.json({
    model: modelKey,
    ...result,
  });
}
