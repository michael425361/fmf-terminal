import type { Locale } from "@/i18n/routing";

const LOCALE_PREFIX = /^\/(en|zh)(\/|$)/;

/** Safe post-login path (must stay on this origin). */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/en";
  }
  if (!LOCALE_PREFIX.test(next)) {
    return next === "/" ? "/en" : `/en${next}`;
  }
  return next;
}

/** Current browser origin (respects dev port, e.g. :3004). */
export function getBrowserOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

/**
 * Build OAuth redirect URL for Supabase `redirectTo`.
 * Must match an entry in Supabase → Authentication → Redirect URLs.
 */
export function buildOAuthCallbackUrl(
  locale: Locale,
  nextPath?: string
): string | undefined {
  const origin = getBrowserOrigin();
  if (!origin) return undefined;

  const path =
    typeof window !== "undefined"
      ? (() => {
          const p = window.location.pathname;
          if (LOCALE_PREFIX.test(p) || p === `/${locale}`) return p;
          return `/${locale}${p === "/" ? "" : p}`;
        })()
      : `/${locale}`;

  const next = sanitizeNextPath(nextPath ?? path);
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function logOAuthClick(provider: string, redirectTo: string | undefined): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log("OAuth clicked:", {
    provider,
    redirectTo,
    origin: getBrowserOrigin(),
  });
}
