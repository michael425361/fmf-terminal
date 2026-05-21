import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

/** Paths that must never pass through locale middleware */
function isApiOrAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/auth/callback")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isApiOrAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    /*
     * Locale pages + root only. Do NOT match /api — next-intl would rewrite
     * API requests and return HTML (causes "Unexpected token '<'" on fetch).
     */
    "/",
    "/(en|zh)/:path*",
  ],
};
