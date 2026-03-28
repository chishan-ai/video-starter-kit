import { NextResponse } from "next/server";
import { db } from "@/db";
import { shots, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

// POST /api/projects/[id]/shots/reorder
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

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { orderedIds } = parsed.data;

  // Update order for each shot in sequence to maintain consistency
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(shots)
      .set({ order: i })
      .where(and(eq(shots.id, orderedIds[i]), eq(shots.projectId, params.id)));
  }

  return NextResponse.json({ success: true });
}
