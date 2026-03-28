import { db } from "@/db";
import { users, creditTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type CreditType =
  | "purchase"
  | "subscription"
  | "generation"
  | "export"
  | "bonus"
  | "refund";

// Cost table for different operations (in credits)
export const CREDIT_COSTS = {
  "vidu-q3-i2v": 10, // Vidu Q3 image-to-video (~$0.07/s * 4s)
  "vidu-q3-t2v": 10,
  "kling-3-pro-i2v": 30, // Kling 3.0 Pro (~3x Vidu cost)
  "kling-3-pro-t2v": 30,
  // Reference-to-video models
  "kling-o1-ref": 20,
  "vidu-q1-ref": 15,
  "vidu-q2-ref": 15,
  // Image generation models
  "flux-kontext-pro": 3,
  "flux-kontext-max": 5,
  "kling-image-o1": 2,
  "character-design": 8,
  "flux-schnell": 1, // Character image generation
  "f5-tts": 2, // Text-to-speech per shot
  "minimax-music": 3, // Background music generation (~$0.03)
  "export-720p": 5, // Export cost
  "export-1080p": 10,
} as const;

export async function getBalance(userId: string): Promise<number> {
  const [user] = await db
    .select({ creditsBalance: users.creditsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.creditsBalance ?? 0;
}

export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description: string,
  relatedId?: string,
): Promise<{ success: boolean; balance: number }> {
  // Atomic deduction: check balance and deduct in one query
  const [updated] = await db
    .update(users)
    .set({
      creditsBalance: sql`${users.creditsBalance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditsBalance: users.creditsBalance });

  if (!updated || updated.creditsBalance < 0) {
    // Rollback if balance went negative
    if (updated) {
      await db
        .update(users)
        .set({
          creditsBalance: sql`${users.creditsBalance} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
    return { success: false, balance: (updated?.creditsBalance ?? 0) + amount };
  }

  // Record the transaction
  await db.insert(creditTransactions).values({
    userId,
    amount: -amount,
    type,
    description,
    relatedId,
  });

  return { success: true, balance: updated.creditsBalance };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description: string,
  relatedId?: string,
): Promise<number> {
  const [updated] = await db
    .update(users)
    .set({
      creditsBalance: sql`${users.creditsBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditsBalance: users.creditsBalance });

  await db.insert(creditTransactions).values({
    userId,
    amount,
    type,
    description,
    relatedId,
  });

  return updated.creditsBalance;
}
