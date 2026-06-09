import { NextResponse } from "next/server";
import {
  AI_CACHE_TTL_SECONDS,
  aiCacheKey,
  withAICache,
} from "@/lib/cache/ai-cache";
import {
  generateResearchReport,
  type ResearchReportResult,
} from "@/lib/ai/research-report";
import { getOpenAIConfig } from "@/lib/ai/openai-config";
import {
  enforceRateLimit,
  parseBody,
  researchReportBodySchema,
  resolveRouteLocale,
  serverError,
  serviceUnavailable,
} from "@/lib/ai/api-helpers";
import { guardAIRequest, recordAIUsage } from "@/lib/usage/guard";
import { clientIp } from "@/lib/saas/rate-limit-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "/api/ai/research-report";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "research-report", 8);
  if (limited) return limited;

  const parsed = await parseBody(request, researchReportBodySchema);
  if ("error" in parsed) return parsed.error;
  const { ticker, locale: bodyLocale } = parsed.data;

  if (!getOpenAIConfig().isConfigured) {
    return serviceUnavailable("AI research report temporarily unavailable");
  }

  const locale = resolveRouteLocale(request, bodyLocale);

  const guard = await guardAIRequest(
    "research-report",
    locale,
    clientIp(request)
  );
  if (!guard.ok) return guard.response;

  const skipCache =
    request.headers.get("x-skip-cache") === "1" ||
    new URL(request.url).searchParams.get("refresh") === "1";

  const key = aiCacheKey("research-report", ticker, locale);

  try {
    const produce = () => generateResearchReport(ticker, { locale });

    if (skipCache) {
      const data = await produce();
      await recordAIUsage(guard.ctx, {
        endpoint: ENDPOINT,
        feature: "research-report",
        cached: false,
        responseText: JSON.stringify(data),
      });
      return NextResponse.json({ ok: true, cached: false, data });
    }

    const { data, cached } = await withAICache<ResearchReportResult>(
      key,
      AI_CACHE_TTL_SECONDS["research-report"],
      produce
    );

    await recordAIUsage(guard.ctx, {
      endpoint: ENDPOINT,
      feature: "research-report",
      cached,
      responseText: JSON.stringify(data),
    });

    return NextResponse.json(
      { ok: true, cached, data },
      { headers: { "Cache-Control": "private, max-age=900" } }
    );
  } catch (err) {
    console.error(
      "[api/ai/research-report]",
      err instanceof Error ? err.message : err
    );
    return serverError("Failed to generate research report");
  }
}
