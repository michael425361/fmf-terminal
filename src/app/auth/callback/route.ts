import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/oauth";

function authErrorRedirect(origin: string, message?: string | null) {
  const params = new URLSearchParams({ auth_error: "1" });
  if (message) params.set("auth_message", message.slice(0, 200));
  return NextResponse.redirect(`${origin}/en?${params.toString()}`);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;
  const providerError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (providerError) {
    console.error("[auth/callback] OAuth provider error:", providerError);
    return authErrorRedirect(origin, providerError);
  }

  if (!code) {
    console.error("[auth/callback] Missing code query param");
    return authErrorRedirect(origin, "missing_code");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[auth/callback] Supabase env not configured");
    return authErrorRedirect(origin, "not_configured");
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return authErrorRedirect(origin, error.message);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[auth/callback] Session established, redirecting to", next);
  }

  return response;
}
