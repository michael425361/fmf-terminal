import "server-only";

import YahooFinance from "yahoo-finance2";
import { resolveTimeframeConfig } from "@/lib/chart/timeframes";
import type { CandleSeriesResponse, ChartTimeframe, OHLCVBar } from "@/lib/chart/types";
import { sanitizeCandleBars } from "@/lib/chart/sanitize-candles";
import { getSanitizeOptionsForMarket } from "./candle-sanitize-presets";
import {
  detectMarketFromSymbol,
  normalizeYahooSymbol,
  type DetectedMarket,
} from "./symbol-normalize";
import { filterSessionBars, getMarketTimezone } from "./session-filter";

let yahooClient: InstanceType<typeof YahooFinance> | null = null;

function getClient() {
  if (!yahooClient) {
    yahooClient = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  }
  return yahooClient;
}

function quotesToBars(
  quotes: Array<{
    date?: Date | null;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    volume?: number | null;
  }>
): OHLCVBar[] {
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

    const open = q.open;
    const high = q.high;
    const low = q.low;
    const close = q.close;

    if (
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      open <= 0 ||
      high <= 0 ||
      low <= 0 ||
      close <= 0
    ) {
      continue;
    }

    bars.push({
      time: Math.floor(q.date.getTime() / 1000),
      open,
      high,
      low,
      close,
      volume: q.volume != null && Number.isFinite(q.volume) ? q.volume : 0,
    });
  }

  return bars;
}

function logCandleDebug(payload: {
  symbol: string;
  resolvedSymbol: string;
  timeframe: ChartTimeframe;
  interval: string;
  timezone?: string;
  rawCount: number;
  candleCount: number;
  rejectedCount: number;
  isFallback: boolean;
  market: DetectedMarket;
}): void {
  console.info("[candles]", {
    symbol: payload.symbol,
    resolvedSymbol: payload.resolvedSymbol,
    interval: payload.interval,
    timeframe: payload.timeframe,
    timezone: payload.timezone ?? "exchange",
    candleCount: payload.candleCount,
    rawCount: payload.rawCount,
    rejectedCount: payload.rejectedCount,
    isFallback: payload.isFallback,
    market: payload.market,
  });
}

export async function fetchCandleSeries(
  symbol: string,
  timeframe: ChartTimeframe
): Promise<CandleSeriesResponse | null> {
  const yahooSymbol = normalizeYahooSymbol(symbol);
  const market = detectMarketFromSymbol(yahooSymbol);
  const config = resolveTimeframeConfig(timeframe, market);
  const yf = getClient();
  const period1 = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);
  const period2 = new Date();
  const exchangeTimezone = getMarketTimezone(market);
  const isSessionEquity =
    market === "hk" || market === "tw" || market === "us" || market === "cn";

  try {
    const result = await yf.chart(
      yahooSymbol,
      {
        period1,
        period2,
        interval: config.interval,
        includePrePost: isSessionEquity ? false : undefined,
      },
      { validateResult: false }
    );

    const rawQuotes = result.quotes ?? [];
    const sessionBars = filterSessionBars(
      quotesToBars(rawQuotes),
      market,
      timeframe
    );

    const sanitizeOpts = getSanitizeOptionsForMarket(
      market,
      yahooSymbol,
      timeframe
    );
    const { bars: clean, rejected } = sanitizeCandleBars(sessionBars, sanitizeOpts);

    if (rejected.length > 0 && clean.length >= 2) {
      console.warn(
        `[candles:${yahooSymbol}/${timeframe}] Sanitized ${rejected.length} invalid bar(s); ${clean.length} remaining`
      );
    }

    logCandleDebug({
      symbol,
      resolvedSymbol: yahooSymbol,
      timeframe,
      interval: config.interval,
      timezone: result.meta?.exchangeTimezoneName ?? exchangeTimezone,
      rawCount: sessionBars.length,
      candleCount: clean.length,
      rejectedCount: rejected.length,
      isFallback: false,
      market,
    });

    if (clean.length < 2) {
      console.warn(
        `[candles:${yahooSymbol}/${timeframe}] Insufficient bars after sanitize (${clean.length}/${sessionBars.length} raw)`
      );
      return null;
    }

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
      debug: {
        symbol,
        resolvedSymbol: yahooSymbol,
        interval: config.interval,
        candleCount: clean.length,
        rawCount: sessionBars.length,
        rejectedCount: rejected.length,
        isFallback: false,
        timezone: result.meta?.exchangeTimezoneName ?? exchangeTimezone,
        market,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Yahoo chart failed";
    console.error("[candles] fetch failed", {
      symbol,
      resolvedSymbol: yahooSymbol,
      timeframe,
      interval: config.interval,
      isFallback: false,
      error: message,
    });
    return null;
  }
}
