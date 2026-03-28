import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, addCredits, CREDIT_COSTS } from "@/lib/credits";
import { falServer, getMusicEndpoint } from "@/lib/fal-server";
import { z } from "zod";

const musicSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.number().min(5).max(60).default(30),
});

// POST /api/projects/:id/generate-music
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
  const parsed = musicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { prompt, duration } = parsed.data;
  const creditCost = CREDIT_COSTS["minimax-music"];

  const deduction = await deductCredits(
    user.id,
    creditCost,
    "generation",
    `Music generation: minimax-music`,
    project.id,
  );

  if (!deduction.success) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        balance: deduction.balance,
        required: creditCost,
      },
      { status: 402 },
    );
  }

  const endpoint = getMusicEndpoint("minimax-music");

  try {
    const { request_id } = await falServer.queue.submit(endpoint, {
      input: {
        prompt,
        duration,
      },
    });

    // Save prompt and request ID on project
    await db
      .update(projects)
      .set({
        musicPrompt: prompt,
        musicRequestId: request_id,
        musicUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id));

    return NextResponse.json({
      requestId: request_id,
      model: endpoint,
      creditsUsed: creditCost,
      balance: deduction.balance,
    });
  } catch (error) {
    await addCredits(
      user.id,
      creditCost,
      "refund",
      `Refund: Music generation failed`,
      project.id,
    );

    const message =
      error instanceof Error ? error.message : "Music generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
