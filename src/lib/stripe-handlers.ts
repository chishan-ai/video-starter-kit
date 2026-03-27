import type Stripe from "stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addCredits } from "@/lib/credits";
import { getPlanByPriceId, getCreditPackByPriceId, PLANS } from "@/lib/stripe";
import type { PlanKey } from "@/lib/stripe";

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const type = session.metadata?.type; // "subscription" or "credits"

  if (type === "credits") {
    // One-time credit pack purchase
    const packId = session.metadata?.packId;
    const pack = packId
      ? { credits: Number.parseInt(session.metadata?.credits ?? "0", 10) }
      : null;

    if (pack && pack.credits > 0) {
      await addCredits(
        userId,
        pack.credits,
        "purchase",
        `Credit pack: ${pack.credits} credits`,
        session.id,
      );
    }
  } else if (type === "subscription") {
    // New subscription
    const planKey = (session.metadata?.plan as PlanKey) ?? null;
    const plan = planKey ? PLANS[planKey] : null;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (plan && planKey) {
      await db
        .update(users)
        .set({
          plan: planKey,
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      await addCredits(
        userId,
        plan.credits,
        "subscription",
        `Subscription: ${plan.name} plan`,
        session.id,
      );
    }
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Recurring subscription payment
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails?.subscription) return;

  const subscriptionId =
    typeof subDetails.subscription === "string"
      ? subDetails.subscription
      : subDetails.subscription.id;

  // Find user by subscription ID
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!user) return;

  // Skip the first invoice (already handled by checkout.session.completed)
  if (invoice.billing_reason === "subscription_create") return;

  const plan = PLANS[user.plan as PlanKey];
  if (plan && plan.credits > 0) {
    await addCredits(
      user.id,
      plan.credits,
      "subscription",
      `Monthly renewal: ${plan.name} plan`,
      invoice.id,
    );
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!user) return;

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newPlan = getPlanByPriceId(priceId);
  if (newPlan && newPlan !== user.plan) {
    await db
      .update(users)
      .set({
        plan: newPlan,
        planExpiresAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!user) return;

  await db
    .update(users)
    .set({
      plan: "free",
      stripeSubscriptionId: null,
      planExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
}
