import { NextResponse } from "next/server";
import {
  AI_CACHE_TTL_SECONDS,
  aiCacheKey,
  withAICache,
} from "@/lib/cache/ai-cache";
import {
  analyzeEarnings,
  type EarningsAnalysisResult,
} from "@/lib/ai/earnings-analysis";
import { getOpenAIConfig } from "@/lib/ai/openai-config";
import {
  earningsAnalysisBodySchema,
  enforceRateLimit,
  parseBody,
  resolveRouteLocale,
  serverError,
  serviceUnavailable,
} from "@/lib/ai/api-helpers";
import { guardAIRequest, recordAIUsage } from "@/lib/usage/guard";
import { clientIp } from "@/lib/saas/rate-limit-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "/api/ai/earnings-analysis";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "earnings-analysis", 12);
  if (limited) return limited;

  const parsed = await parseBody(request, earningsAnalysisBodySchema);
  if ("error" in parsed) return parsed.error;
  const { ticker, locale: bodyLocale } = parsed.data;

  if (!getOpenAIConfig().isConfigured) {
    return serviceUnavailable("AI earnings analysis temporarily unavailable");
  }

  const locale = resolveRouteLocale(request, bodyLocale);

  const guard = await guardAIRequest(
    "earnings-analysis",
    locale,
    clientIp(request)
  );
  if (!guard.ok) return guard.response;

  const skipCache =
    request.headers.get("x-skip-cache") === "1" ||
    new URL(request.url).searchParams.get("refresh") === "1";

  const key = aiCacheKey("earnings-analysis", ticker, locale);

  try {
    const produce = () => analyzeEarnings(ticker, { locale });

    if (skipCache) {
      const data = await produce();
      await recordAIUsage(guard.ctx, {
        endpoint: ENDPOINT,
        feature: "earnings-analysis",
        cached: false,
        responseText: JSON.stringify(data),
      });
      return NextResponse.json({ ok: true, cached: false, data });
    }

    const { data, cached } = await withAICache<EarningsAnalysisResult>(
      key,
      AI_CACHE_TTL_SECONDS["earnings-analysis"],
      produce
    );

    await recordAIUsage(guard.ctx, {
      endpoint: ENDPOINT,
      feature: "earnings-analysis",
      cached,
      responseText: JSON.stringify(data),
    });

    return NextResponse.json(
      { ok: true, cached, data },
      { headers: { "Cache-Control": "private, max-age=900" } }
    );
  } catch (err) {
    console.error(
      "[api/ai/earnings-analysis]",
      err instanceof Error ? err.message : err
    );
    return serverError("Failed to generate earnings analysis");
  }
}
