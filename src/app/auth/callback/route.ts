import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Completes email-link and confirmation sign-ins. Supabase redirects here with a
 * one-time code; exchanging it sets the session cookies for the browser client.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const response = NextResponse.redirect(new URL(next, url.origin));

  if (!code || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }
  return response;
}
