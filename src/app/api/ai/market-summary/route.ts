import { NextResponse } from "next/server";
import { generateMarketSummary } from "@/lib/ai/openai-market-summary";
import { getOpenAIConfig } from "@/lib/ai/openai-config";
import {
  getCachedMarketSummary,
  marketSummaryCacheKey,
  setCachedMarketSummary,
} from "@/lib/ai/market-summary-cache";
import type {
  MarketSummaryRequest,
  MarketSummaryResponse,
} from "@/lib/ai/types";
import {
  resolveAISummaryLocale,
  type AISummaryLocale,
} from "@/lib/ai/locale";
import { detectMarketFromSymbol } from "@/lib/market-data/symbol-normalize";

export const dynamic = "force-dynamic";

const UNAVAILABLE: MarketSummaryResponse = {
  summary: "",
  sentiment: "neutral",
  highlights: [],
  unavailable: true,
  message: "AI summary temporarily unavailable",
};

function isValidBody(body: unknown): body is MarketSummaryRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as MarketSummaryRequest;
  return typeof b.symbol === "string" && b.symbol.trim().length > 0;
}

export async function POST(request: Request) {
  const skipCache =
    request.headers.get("x-skip-cache") === "1" ||
    new URL(request.url).searchParams.get("refresh") === "1";

  const openaiCfg = getOpenAIConfig();

  if (process.env.NODE_ENV === "development") {
    console.log("[ai/market-summary] OPENAI_API_KEY prefix:", openaiCfg.keyPrefix);
    console.log("[ai/market-summary] model:", openaiCfg.model);
    console.log("[ai/market-summary] configured:", openaiCfg.isConfigured);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const symbol = body.symbol.trim();
  const market =
    body.market && body.market !== "unknown"
      ? body.market
      : detectMarketFromSymbol(symbol);

  const locale: AISummaryLocale = resolveAISummaryLocale({
    bodyLocale: body.locale,
    headerLocale:
      request.headers.get("x-fmf-locale") ??
      request.headers.get("x-next-intl-locale"),
    acceptLanguage: request.headers.get("accept-language"),
  });

  const payload: MarketSummaryRequest = {
    symbol,
    market,
    locale,
    quote: body.quote ?? null,
    candles: Array.isArray(body.candles) ? body.candles : [],
    indicators: body.indicators,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[ai/market-summary] request body:", {
      symbol: payload.symbol,
      market: payload.market,
      locale: payload.locale,
      bodyLocale: body.locale,
      headerLocale: request.headers.get("x-fmf-locale"),
      candleCount: payload.candles?.length ?? 0,
      hasQuote: Boolean(payload.quote),
      hasIndicators: Boolean(payload.indicators),
      skipCache,
    });
  }

  if (!openaiCfg.isConfigured) {
    console.error(
      "[ai/market-summary] OPENAI_API_KEY missing — add to .env.local and restart dev server"
    );
    return NextResponse.json(UNAVAILABLE, { status: 200 });
  }

  const cacheKey = marketSummaryCacheKey(symbol, market, locale);

  if (!skipCache) {
    const cached = getCachedMarketSummary(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    }
  }

  try {
    const result = await generateMarketSummary(payload);
    setCachedMarketSummary(cacheKey, { ...result, locale });
    return NextResponse.json({ ...result, locale }, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai/market-summary] error:", message);
    if (err instanceof Error && err.stack) {
      console.error("[ai/market-summary] stack:", err.stack);
    }
    return NextResponse.json(UNAVAILABLE, { status: 200 });
  }
}
