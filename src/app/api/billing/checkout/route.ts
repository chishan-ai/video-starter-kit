import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS, CREDIT_PACKS, type PlanKey } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("subscription"),
    plan: z.enum(["starter", "pro", "studio"]),
    interval: z.enum(["month", "year"]).default("month"),
  }),
  z.object({
    type: z.literal("credits"),
    packId: z.enum(["pack-200", "pack-500", "pack-1000"]),
  }),
]);

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Get or create Stripe customer
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let customerId = dbUser.stripeCustomerId;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  const data = parsed.data;

  if (data.type === "subscription") {
    const plan = PLANS[data.plan as PlanKey];
    const priceId =
      data.interval === "year" ? plan.annualPriceId : plan.monthlyPriceId;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for this plan" },
        { status: 400 },
      );
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.headers.get("origin")}/billing?success=true`,
      cancel_url: `${request.headers.get("origin")}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        type: "subscription",
        plan: data.plan,
      },
    });

    return NextResponse.json({ url: session.url });
  }

  // Credit pack purchase
  const pack = CREDIT_PACKS.find((p) => p.id === data.packId);
  if (!pack || !pack.priceId) {
    return NextResponse.json(
      { error: "Pack not configured" },
      { status: 400 },
    );
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [{ price: pack.priceId, quantity: 1 }],
    success_url: `${request.headers.get("origin")}/billing?success=true`,
    cancel_url: `${request.headers.get("origin")}/billing?canceled=true`,
    metadata: {
      userId: user.id,
      type: "credits",
      packId: data.packId,
      credits: String(pack.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}
