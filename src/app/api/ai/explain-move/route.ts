import { NextResponse } from "next/server";
import {
  AI_CACHE_TTL_SECONDS,
  aiCacheKey,
  withAICache,
} from "@/lib/cache/ai-cache";
import { explainMove, type ExplainMoveResult } from "@/lib/ai/explain-move";
import { getOpenAIConfig } from "@/lib/ai/openai-config";
import {
  enforceRateLimit,
  explainMoveBodySchema,
  parseBody,
  resolveRouteLocale,
  serverError,
  serviceUnavailable,
} from "@/lib/ai/api-helpers";
import { guardAIRequest, recordAIUsage } from "@/lib/usage/guard";
import { clientIp } from "@/lib/saas/rate-limit-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "/api/ai/explain-move";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "explain-move", 20);
  if (limited) return limited;

  const parsed = await parseBody(request, explainMoveBodySchema);
  if ("error" in parsed) return parsed.error;
  const { ticker, priceChange, volumeChange, locale: bodyLocale } = parsed.data;

  if (!getOpenAIConfig().isConfigured) {
    return serviceUnavailable("AI explain-move temporarily unavailable");
  }

  const locale = resolveRouteLocale(request, bodyLocale);

  const guard = await guardAIRequest("explain-move", locale, clientIp(request));
  if (!guard.ok) return guard.response;

  const skipCache =
    request.headers.get("x-skip-cache") === "1" ||
    new URL(request.url).searchParams.get("refresh") === "1";

  const key = aiCacheKey(
    "explain-move",
    ticker,
    locale,
    Math.round(priceChange * 10) / 10
  );

  try {
    const produce = () =>
      explainMove({ ticker, priceChange, volumeChange }, { locale });

    if (skipCache) {
      const data = await produce();
      await recordAIUsage(guard.ctx, {
        endpoint: ENDPOINT,
        feature: "explain-move",
        cached: false,
        responseText: JSON.stringify(data),
      });
      return NextResponse.json({ ok: true, cached: false, data });
    }

    const { data, cached } = await withAICache<ExplainMoveResult>(
      key,
      AI_CACHE_TTL_SECONDS["explain-move"],
      produce
    );

    await recordAIUsage(guard.ctx, {
      endpoint: ENDPOINT,
      feature: "explain-move",
      cached,
      responseText: JSON.stringify(data),
    });

    return NextResponse.json(
      { ok: true, cached, data },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (err) {
    console.error("[api/ai/explain-move]", err instanceof Error ? err.message : err);
    return serverError("Failed to generate explanation");
  }
}
