import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { isClerkConfigured } from "@/lib/saas/config";

const intlMiddleware = createIntlMiddleware(routing);

/** Paths that must never pass through locale middleware (would break JSON/redirects). */
function isApiOrAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/auth/callback")
  );
}

/** Locale-prefixed routes that require an authenticated Clerk session. */
const isProtectedRoute = createRouteMatcher([
  "/(en|zh)/account(.*)",
  "/(en|zh)/admin(.*)",
]);

/** Runs i18n routing + Supabase session refresh for page requests. */
function localePipeline(request: NextRequest): Promise<NextResponse> {
  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

/**
 * When Clerk is configured we wrap the locale pipeline in clerkMiddleware so
 * `auth()` is available in route handlers and protected pages redirect to
 * sign-in. When Clerk is NOT configured we fall back to the original
 * intl + Supabase behavior so builds/tests without secrets stay green.
 */
const clerkHandler = isClerkConfigured()
  ? clerkMiddleware(async (auth, request) => {
      const { pathname } = request.nextUrl;
      if (isApiOrAuthRoute(pathname)) {
        return NextResponse.next();
      }
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
      return localePipeline(request);
    })
  : null;

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  if (clerkHandler) {
    return clerkHandler(request, event);
  }
  const { pathname } = request.nextUrl;
  if (isApiOrAuthRoute(pathname)) {
    return NextResponse.next();
  }
  return localePipeline(request);
}

export const config = {
  matcher: [
    /*
     * Run on locale pages + root, and on API routes (so Clerk attaches auth
     * context). The handler short-circuits API/auth routes BEFORE next-intl,
     * so API responses are never rewritten to HTML.
     */
    "/",
    "/(en|zh)/:path*",
    "/(api)(.*)",
  ],
};
