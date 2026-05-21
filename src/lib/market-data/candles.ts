import "server-only";

import YahooFinance from "yahoo-finance2";
import { TIMEFRAME_CONFIG } from "@/lib/chart/timeframes";
import type { CandleSeriesResponse, ChartTimeframe, OHLCVBar } from "@/lib/chart/types";
import { sanitizeCandleBars } from "@/lib/chart/sanitize-candles";
import {
  detectMarketFromSymbol,
  normalizeYahooSymbol,
} from "./symbol-normalize";

let yahooClient: InstanceType<typeof YahooFinance> | null = null;

function getClient() {
  if (!yahooClient) yahooClient = new YahooFinance();
  return yahooClient;
}

export async function fetchCandleSeries(
  symbol: string,
  timeframe: ChartTimeframe
): Promise<CandleSeriesResponse | null> {
  const yahooSymbol = normalizeYahooSymbol(symbol);
  const market = detectMarketFromSymbol(yahooSymbol);
  const config = TIMEFRAME_CONFIG[timeframe];
  const yf = getClient();
  const period1 = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);

  try {
    const result = await yf.chart(yahooSymbol, {
      period1,
      interval: config.interval,
    });

    const quotes = result.quotes ?? [];
    const bars: OHLCVBar[] = [];

    for (const q of quotes) {
      if (
        !q.date ||
        q.open == null ||
        q.high == null ||
        q.low == null ||
        q.close == null
      ) {
        continue;
      }
      bars.push({
        time: Math.floor(q.date.getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume ?? 0,
      });
    }

    const isAsiaEquity = market === "hk" || market === "tw";
    const { bars: clean, rejected } = sanitizeCandleBars(bars, {
      symbol: yahooSymbol,
      timeframe,
      logWarnings: true,
      allowZeroVolumeIntraday: isAsiaEquity,
      maxBodyMoveFromPrev: isAsiaEquity ? 0.55 : undefined,
    });

    if (rejected.length > 0 && clean.length >= 2) {
      console.warn(
        `[candles:${symbol}/${timeframe}] Sanitized ${rejected.length} invalid bar(s); ${clean.length} remaining`
      );
    }

    if (clean.length < 2) return null;

    const first = clean[0].close;
    const last = clean[clean.length - 1].close;
    const change = last - first;
    const changePercent = first !== 0 ? (change / first) * 100 : 0;

    return {
      symbol: yahooSymbol,
      timeframe,
      bars: clean,
      change,
      changePercent,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
