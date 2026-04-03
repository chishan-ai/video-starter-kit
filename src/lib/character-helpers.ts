import { NextResponse } from "next/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

type CharacterRow = typeof characters.$inferSelect;

type AuthResult =
  | { ok: true; user: { id: string }; character: CharacterRow }
  | { ok: false; response: NextResponse };

/**
 * Authenticate the user and fetch a character they own.
 * Returns a typed union: either { ok, user, character } or { ok: false, response }.
 */
export async function getAuthenticatedCharacter(
  characterId: string,
): Promise<AuthResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const [character] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.id, characterId), eq(characters.userId, user.id)))
    .limit(1);

  if (!character) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { ok: true, user, character };
}
