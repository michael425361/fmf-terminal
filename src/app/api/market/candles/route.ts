import { NextResponse } from "next/server";
import { fetchCandleSeries } from "@/lib/market-data/candles";
import { normalizeYahooSymbol } from "@/lib/market-data/symbol-normalize";
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

  try {
    const data = await fetchCandleSeries(symbol, timeframe);
    if (!data) {
      console.warn("[candles/api] unavailable", {
        symbol: rawSymbol,
        resolvedSymbol: symbol,
        timeframe,
        isFallback: false,
      });
      return NextResponse.json(
        { error: "Candle data unavailable" },
        { status: 404 }
      );
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Candle fetch failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
