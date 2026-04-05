import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/terms",
    "/privacy",
  ];
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path,
  );
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isWebhook = request.nextUrl.pathname.startsWith("/api/webhooks/");
  const isStaticAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".");

  if (!user && !isPublicPath && !isApiAuth && !isWebhook && !isStaticAsset) {
    // API routes should return 401 JSON, not redirect
    if (request.nextUrl.pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // Carry over any refreshed cookies so the browser stores them
      supabaseResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          res.headers.append(key, value);
        }
      });
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    // Carry over any refreshed cookies so the browser stores them
    supabaseResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        res.headers.append(key, value);
      }
    });
    return res;
  }

  return supabaseResponse;
}
