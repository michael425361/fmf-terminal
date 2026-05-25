/** Supported AI summary output languages. */
export type AISummaryLocale = "zh" | "en";

export function normalizeAISummaryLocale(
  raw?: string | null
): AISummaryLocale {
  if (!raw) return "en";
  const lower = raw.trim().toLowerCase();
  if (lower === "zh" || lower.startsWith("zh-")) return "zh";
  return "en";
}

/** Infer locale from Next.js pathname (`/zh/...` or `/en/...`). */
export function localeFromPathname(pathname: string): AISummaryLocale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return normalizeAISummaryLocale(seg);
}

export function resolveAISummaryLocale(options: {
  bodyLocale?: string | null;
  headerLocale?: string | null;
  pathname?: string | null;
  acceptLanguage?: string | null;
}): AISummaryLocale {
  if (options.bodyLocale?.trim()) {
    return normalizeAISummaryLocale(options.bodyLocale);
  }

  if (options.headerLocale?.trim()) {
    return normalizeAISummaryLocale(options.headerLocale);
  }

  if (options.pathname) {
    return localeFromPathname(options.pathname);
  }

  const accept = options.acceptLanguage ?? "";
  if (/\bzh(-cn|-tw|-hk)?\b/i.test(accept)) return "zh";

  return "en";
}
