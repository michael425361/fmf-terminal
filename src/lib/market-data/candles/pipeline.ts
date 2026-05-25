import "server-only";

import {
  resolveTimeframeResolution,
  type TimeframeResolution,
} from "@/lib/chart/timeframe-resolution";
import type { CandleSeriesResponse, ChartTimeframe, OHLCVBar } from "@/lib/chart/types";
import { sanitizeCandleBars } from "@/lib/chart/sanitize-candles";
import { getSanitizeOptionsForMarket } from "../candle-sanitize-presets";
import type { DetectedMarket } from "../symbol-normalize";
import { getChartTimezone } from "@/lib/chart/market-config";
import { filterSessionBars } from "../session-filter";
import type { ProviderCandleResult } from "../providers/types";
import { getPrimaryProvider } from "./registry";

function exchangeDateKey(unixSec: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSec * 1000));
}

/** Merge finer bars into target period buckets (OHLCV). */
export function aggregateCandles(
  bars: OHLCVBar[],
  targetPeriodSec: number
): OHLCVBar[] {
  if (bars.length < 2 || targetPeriodSec <= 0) return bars;

  const sorted = [...bars].sort((a, b) => a.time - b.time);
  const medianDelta =
    sorted.length > 1
      ? sorted[Math.floor(sorted.length / 2)].time -
        sorted[Math.floor(sorted.length / 2) - 1].time
      : targetPeriodSec;

  if (medianDelta >= targetPeriodSec * 0.85) return sorted;

  const buckets = new Map<number, OHLCVBar>();

  for (const bar of sorted) {
    const bucketTime =
      Math.floor(bar.time / targetPeriodSec) * targetPeriodSec;
    const existing = buckets.get(bucketTime);

    if (!existing) {
      buckets.set(bucketTime, { ...bar, time: bucketTime });
      continue;
    }

    existing.high = Math.max(existing.high, bar.high);
    existing.low = Math.min(existing.low, bar.low);
    existing.close = bar.close;
    existing.volume += bar.volume;
  }

  return [...buckets.values()].sort((a, b) => a.time - b.time);
}

export function trimToDisplayWindow(
  bars: OHLCVBar[],
  resolution: TimeframeResolution,
  market: DetectedMarket
): OHLCVBar[] {
  if (bars.length < 2) return bars;

  const tz = getChartTimezone(market);
  const cutoffSec =
    Math.floor(Date.now() / 1000) - resolution.displayDays * 86400;
  let trimmed = bars.filter((b) => b.time >= cutoffSec);
  if (trimmed.length < 2) trimmed = bars;

  if (resolution.sessionMode === "singleDay") {
    const lastKey = exchangeDateKey(trimmed[trimmed.length - 1].time, tz);
    const dayBars = trimmed.filter(
      (b) => exchangeDateKey(b.time, tz) === lastKey
    );
    if (dayBars.length >= 2) return dayBars;
    const barsPerDay = Math.ceil((6.5 * 60) / (resolution.barPeriodSeconds / 60));
    return trimmed.slice(-Math.max(barsPerDay, 60));
  }

  if (resolution.sessionMode === "multiDay") {
    const keys: string[] = [];
    const out: OHLCVBar[] = [];
    for (let i = trimmed.length - 1; i >= 0; i--) {
      const key = exchangeDateKey(trimmed[i].time, tz);
      if (!keys.includes(key)) keys.push(key);
      if (keys.length > resolution.displayDays) break;
      out.unshift(trimmed[i]);
    }
    return out.length >= 2 ? out : trimmed;
  }

  if (resolution.sessionMode === "daily" || resolution.sessionMode === "hourly") {
    return trimmed;
  }

  return trimmed;
}

export function normalizeTimeframeBars(
  bars: OHLCVBar[],
  timeframe: ChartTimeframe,
  market: DetectedMarket
): OHLCVBar[] {
  const resolution = resolveTimeframeResolution(timeframe, market);
  let out = [...bars].sort((a, b) => a.time - b.time);

  if (resolution.filterSession) {
    out = filterSessionBars(out, market, timeframe);
  }

  out = aggregateCandles(out, resolution.barPeriodSeconds);
  out = trimToDisplayWindow(out, resolution, market);

  return out;
}

/** @deprecated Use normalizeTimeframeBars */
export function trimBarsForDisplay(
  bars: OHLCVBar[],
  timeframe: ChartTimeframe,
  market: DetectedMarket
): OHLCVBar[] {
  return normalizeTimeframeBars(bars, timeframe, market);
}

export function buildSeriesFromRaw(
  raw: ProviderCandleResult,
  inputSymbol: string,
  timeframe: ChartTimeframe,
  market: DetectedMarket
): CandleSeriesResponse | null {
  const resolution = resolveTimeframeResolution(timeframe, market);
  const displayBars = normalizeTimeframeBars(raw.bars, timeframe, market);

  const { bars: clean, rejected } = sanitizeCandleBars(
    displayBars,
    getSanitizeOptionsForMarket(market, raw.symbol, timeframe)
  );

  if (clean.length < 2) return null;

  const first = clean[0].close;
  const last = clean[clean.length - 1].close;
  const primary = getPrimaryProvider(market);

  return {
    symbol: raw.symbol,
    timeframe,
    bars: clean,
    change: last - first,
    changePercent: first !== 0 ? ((last - first) / first) * 100 : 0,
    fetchedAt: Date.now(),
    debug: {
      symbol: inputSymbol,
      resolvedSymbol: raw.symbol,
      interval: resolution.interval,
      candleCount: clean.length,
      rawCount: raw.bars.length,
      rejectedCount: rejected.length,
      isFallback: raw.provider !== primary,
      timezone: raw.timezone ?? getChartTimezone(market),
      market,
      provider: raw.provider,
    },
  };
}

export function buildUnavailableResponse(
  symbol: string,
  timeframe: ChartTimeframe,
  market: DetectedMarket
): CandleSeriesResponse {
  const resolution = resolveTimeframeResolution(timeframe, market);
  return {
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
      interval: resolution.interval,
      candleCount: 0,
      rawCount: 0,
      rejectedCount: 0,
      isFallback: false,
      timezone: getChartTimezone(market),
      market,
      provider: "none",
    },
  };
}
