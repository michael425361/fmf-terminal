import { NextResponse } from "next/server";
import {
  AI_CACHE_TTL_SECONDS,
  aiCacheKey,
  withAICache,
} from "@/lib/cache/ai-cache";
import {
  getCompanyNews,
  getMarketNews,
  rankNews,
  summarizeNews,
  type NewsSummary,
  type RankedNewsItem,
} from "@/lib/ai/news-intelligence";
import { getOpenAIConfig } from "@/lib/ai/openai-config";
import {
  enforceRateLimit,
  newsSummaryBodySchema,
  parseBody,
  resolveRouteLocale,
  serverError,
  serviceUnavailable,
} from "@/lib/ai/api-helpers";
import { guardAIRequest, recordAIUsage } from "@/lib/usage/guard";
import { clientIp } from "@/lib/saas/rate-limit-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "/api/ai/news-summary";

interface NewsIntelligenceData {
  scope: string;
  summary: NewsSummary;
  ranked: RankedNewsItem[];
  generatedAt: number;
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "news-summary", 30);
  if (limited) return limited;

  const parsed = await parseBody(request, newsSummaryBodySchema);
  if ("error" in parsed) return parsed.error;
  const { ticker, category = "general", locale: bodyLocale } = parsed.data;

  if (!getOpenAIConfig().isConfigured) {
    return serviceUnavailable("AI news summary temporarily unavailable");
  }

  const locale = resolveRouteLocale(request, bodyLocale);

  const guard = await guardAIRequest("news-summary", locale, clientIp(request));
  if (!guard.ok) return guard.response;

  const scope = ticker ? ticker.toUpperCase() : `market:${category}`;
  const skipCache =
    request.headers.get("x-skip-cache") === "1" ||
    new URL(request.url).searchParams.get("refresh") === "1";

  const key = aiCacheKey("news-summary", scope, locale);

  try {
    const produce = async (): Promise<NewsIntelligenceData> => {
      const items = ticker
        ? await getCompanyNews(ticker, { days: 14, limit: 30 })
        : await getMarketNews(category, { limit: 30 });

      const [ranked, summary] = await Promise.all([
        rankNews(items, { ticker: scope, locale, limit: 8 }),
        items.length > 0
          ? summarizeNews(items, { ticker: scope, locale })
          : Promise.resolve<NewsSummary>({
              summary: "",
              sentiment: "neutral",
              themes: [],
            }),
      ]);

      return { scope, summary, ranked, generatedAt: Date.now() };
    };

    if (skipCache) {
      const data = await produce();
      await recordAIUsage(guard.ctx, {
        endpoint: ENDPOINT,
        feature: "news-summary",
        cached: false,
        responseText: JSON.stringify(data),
      });
      return NextResponse.json({ ok: true, cached: false, data });
    }

    const { data, cached } = await withAICache<NewsIntelligenceData>(
      key,
      AI_CACHE_TTL_SECONDS["news-summary"],
      produce
    );

    await recordAIUsage(guard.ctx, {
      endpoint: ENDPOINT,
      feature: "news-summary",
      cached,
      responseText: JSON.stringify(data),
    });

    return NextResponse.json(
      { ok: true, cached, data },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (err) {
    console.error("[api/ai/news-summary]", err instanceof Error ? err.message : err);
    return serverError("Failed to generate news summary");
  }
}
