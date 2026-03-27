import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe to a plan first." },
      { status: 400 },
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${request.headers.get("origin")}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
