import { NextResponse } from "next/server";
import { db } from "@/db";
import { creditTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/credits";

// GET /api/credits — get balance and recent transactions
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [balance, transactions] = await Promise.all([
    getBalance(user.id),
    db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, user.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(50),
  ]);

  return NextResponse.json({ balance, transactions });
}
