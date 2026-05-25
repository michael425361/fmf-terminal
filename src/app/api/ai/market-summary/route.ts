import { NextResponse } from "next/server";
import { generateMarketSummary } from "@/lib/ai/openai-market-summary";
import {
  getCachedMarketSummary,
  marketSummaryCacheKey,
  setCachedMarketSummary,
} from "@/lib/ai/market-summary-cache";
import type {
  MarketSummaryRequest,
  MarketSummaryResponse,
} from "@/lib/ai/types";
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

  const payload: MarketSummaryRequest = {
    symbol,
    market,
    locale: body.locale === "zh" ? "zh" : "en",
    quote: body.quote ?? null,
    candles: Array.isArray(body.candles) ? body.candles : [],
    indicators: body.indicators,
  };

  const cacheKey = marketSummaryCacheKey(symbol, market);

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
    setCachedMarketSummary(cacheKey, result);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ai/market-summary]", err);
    }
    return NextResponse.json(
      {
        ...UNAVAILABLE,
        message:
          err instanceof Error && err.message.includes("OPENAI_API_KEY")
            ? "AI summary temporarily unavailable"
            : UNAVAILABLE.message,
      },
      { status: 200 }
    );
  }
}
