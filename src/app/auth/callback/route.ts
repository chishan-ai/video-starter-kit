import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user record exists in our DB
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { db } = await import("@/db");
        const { users } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const existing = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            id: user.id,
            email: user.email ?? "",
            name:
              user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
            avatarUrl: user.user_metadata?.avatar_url,
          });
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
