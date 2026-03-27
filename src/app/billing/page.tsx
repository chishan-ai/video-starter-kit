import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [dbUser] = await db
    .select({
      plan: users.plan,
      creditsBalance: users.creditsBalance,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <BillingClient
      email={user.email ?? ""}
      plan={dbUser?.plan ?? "free"}
      balance={dbUser?.creditsBalance ?? 0}
      hasStripeCustomer={!!dbUser?.stripeCustomerId}
    />
  );
}
