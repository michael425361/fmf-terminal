import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAISummaryLocale, type AISummaryLocale } from "./locale";
import { clientKey, rateLimit } from "./rate-limit";

/** Shared Zod primitives for AI route bodies. */
export const tickerSchema = z
  .string()
  .trim()
  .min(1, "ticker required")
  .max(20, "ticker too long")
  .regex(/^[A-Za-z0-9.\-^=]+$/, "invalid ticker");

export const localeSchema = z.enum(["en", "zh"]).optional();

export const explainMoveBodySchema = z.object({
  ticker: tickerSchema,
  priceChange: z.number().finite(),
  volumeChange: z.number().finite().optional().default(0),
  locale: localeSchema,
});

export const researchReportBodySchema = z.object({
  ticker: tickerSchema,
  locale: localeSchema,
});

export const earningsAnalysisBodySchema = z.object({
  ticker: tickerSchema,
  locale: localeSchema,
});

export const newsSummaryBodySchema = z.object({
  ticker: tickerSchema.optional(),
  category: z.enum(["general", "forex", "crypto", "merger"]).optional(),
  locale: localeSchema,
});

export function resolveRouteLocale(
  request: Request,
  bodyLocale?: string | null
): AISummaryLocale {
  return resolveAISummaryLocale({
    bodyLocale,
    headerLocale:
      request.headers.get("x-fmf-locale") ??
      request.headers.get("x-next-intl-locale"),
    acceptLanguage: request.headers.get("accept-language"),
  });
}

/** Apply rate limiting; returns a 429 response when exceeded, else null. */
export function enforceRateLimit(
  request: Request,
  scope: string,
  limit = 20
): NextResponse | null {
  const result = rateLimit(clientKey(request, scope), limit);
  if (result.ok) return null;
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { ok: false, error: "Rate limit exceeded. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, details },
    { status: 400 }
  );
}

export function serviceUnavailable(message: string): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 503 });
}

export function serverError(message: string): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

/** Parse + validate a JSON body against a Zod schema. */
export async function parseBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S
): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: badRequest("Validation failed", parsed.error.flatten()),
    };
  }
  return { data: parsed.data as z.infer<S> };
}
