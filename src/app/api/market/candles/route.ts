import { NextResponse } from "next/server";
import { fetchCandleSeries } from "@/lib/market-data/candles";
import {
  detectMarketFromSymbol,
  normalizeYahooSymbol,
} from "@/lib/market-data/symbol-normalize";
import { getProviderChain } from "@/lib/market-data/candles/registry";
import { resolveTimeframeConfig } from "@/lib/chart/timeframes";
import type { ChartTimeframe } from "@/lib/chart/types";
import { TIMEFRAME_CONFIG } from "@/lib/chart/timeframes";

export const dynamic = "force-dynamic";

const VALID_TF = new Set(Object.keys(TIMEFRAME_CONFIG));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol");
  const timeframe = (searchParams.get("timeframe") ?? "1D") as ChartTimeframe;

  if (!rawSymbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const symbol = normalizeYahooSymbol(rawSymbol);

  if (!VALID_TF.has(timeframe)) {
    return NextResponse.json({ error: "invalid timeframe" }, { status: 400 });
  }

  const market = detectMarketFromSymbol(symbol);
  const config = resolveTimeframeConfig(timeframe, market);

  console.log("Fetching candle data:", {
    symbol: rawSymbol,
    resolvedSymbol: symbol,
    interval: config.interval,
    market,
    providers: getProviderChain(market),
    timeframe,
  });

  try {
    const data = await fetchCandleSeries(symbol, timeframe);

    console.log("Candle API response:", {
      unavailable: data.unavailable ?? false,
      barCount: data.bars.length,
      provider: data.debug?.provider,
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Candle fetch failed";
    return NextResponse.json(
      {
        symbol,
        timeframe,
        bars: [],
        change: 0,
        changePercent: 0,
        fetchedAt: Date.now(),
        unavailable: true,
        message: "Market data temporarily unavailable",
        debug: {
          symbol,
          resolvedSymbol: symbol,
          interval: config.interval,
          candleCount: 0,
          isFallback: false,
          market,
          provider: "none" as const,
        },
        error: message,
      },
      { status: 200 }
    );
  }
}
