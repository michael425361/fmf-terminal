import type { ChartTimeframe } from "./types";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";

export type CandleInterval =
  | "1m"
  | "2m"
  | "5m"
  | "15m"
  | "30m"
  | "60m"
  | "1h"
  | "1d"
  | "1wk";

/** @deprecated Alias for provider APIs */
export type YahooChartInterval = CandleInterval;

import { getChartMarketConfig } from "./market-config";

export type SessionMode = "singleDay" | "multiDay" | "hourly" | "daily" | "none";

/** Controls X-axis tick formatting. */
export type AxisTimeMode = "intraday" | "multiDay" | "longTerm";

export type TimeframeCategory = "tick" | "short" | "swing" | "hourly" | "daily";

export interface TimeframeResolution {
  id: ChartTimeframe;
  label: string;
  /** Provider fetch interval (Yahoo / Finnhub / Binance / TwelveData). */
  interval: CandleInterval;
  /** Calendar days to request from upstream. */
  fetchDays: number;
  /** Visible history window (calendar days). */
  displayDays: number;
  /** Nominal bar period in seconds (for aggregation / gap compression). */
  barPeriodSeconds: number;
  sessionMode: SessionMode;
  /** Remove lunch / overnight gaps on chart (multi-day intraday). */
  compressSessionGaps: boolean;
  /** Apply exchange session filter. */
  filterSession: boolean;
  axisMode: AxisTimeMode;
  category: TimeframeCategory;
}

const BASE_RESOLUTION: Record<ChartTimeframe, TimeframeResolution> = {
  "1D": {
    id: "1D",
    label: "1D",
    interval: "1m",
    fetchDays: 8,
    displayDays: 1,
    barPeriodSeconds: 60,
    sessionMode: "singleDay",
    compressSessionGaps: false,
    filterSession: true,
    axisMode: "intraday",
    category: "tick",
  },
  "5D": {
    id: "5D",
    label: "5D",
    interval: "5m",
    fetchDays: 12,
    displayDays: 5,
    barPeriodSeconds: 300,
    sessionMode: "multiDay",
    compressSessionGaps: true,
    filterSession: true,
    axisMode: "multiDay",
    category: "short",
  },
  "1M": {
    id: "1M",
    label: "1M",
    interval: "30m",
    fetchDays: 38,
    displayDays: 30,
    barPeriodSeconds: 1800,
    sessionMode: "multiDay",
    compressSessionGaps: true,
    filterSession: true,
    axisMode: "multiDay",
    category: "swing",
  },
  "3M": {
    id: "3M",
    label: "3M",
    interval: "1h",
    fetchDays: 100,
    displayDays: 90,
    barPeriodSeconds: 3600,
    sessionMode: "hourly",
    compressSessionGaps: false,
    filterSession: true,
    axisMode: "multiDay",
    category: "hourly",
  },
  "6M": {
    id: "6M",
    label: "6M",
    interval: "1d",
    fetchDays: 200,
    displayDays: 180,
    barPeriodSeconds: 86400,
    sessionMode: "daily",
    compressSessionGaps: false,
    filterSession: false,
    axisMode: "longTerm",
    category: "daily",
  },
  "1Y": {
    id: "1Y",
    label: "1Y",
    interval: "1d",
    fetchDays: 400,
    displayDays: 365,
    barPeriodSeconds: 86400,
    sessionMode: "daily",
    compressSessionGaps: false,
    filterSession: false,
    axisMode: "longTerm",
    category: "daily",
  },
};

export const TIMEFRAME_ORDER: ChartTimeframe[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
];

export function resolveTimeframeResolution(
  timeframe: ChartTimeframe,
  market: DetectedMarket = "unknown"
): TimeframeResolution {
  const base = BASE_RESOLUTION[timeframe];
  const cfg = getChartMarketConfig(market);

  let fetchDays = base.fetchDays;
  if (base.filterSession && base.category !== "daily") {
    fetchDays = Math.max(fetchDays, cfg.minIntradayFetchDays);
  }

  return { ...base, fetchDays };
}

export function isIntradayResolution(resolution: TimeframeResolution): boolean {
  return (
    resolution.category === "tick" ||
    resolution.category === "short" ||
    resolution.category === "swing"
  );
}

export function isIntradayTimeframe(timeframe: ChartTimeframe): boolean {
  return isIntradayResolution(resolveTimeframeResolution(timeframe));
}

export function isDailyTimeframe(timeframe: ChartTimeframe): boolean {
  const r = BASE_RESOLUTION[timeframe];
  return r.category === "daily";
}

/** Legacy shape for routes / debug. */
export function toTimeframeConfig(
  resolution: TimeframeResolution
): {
  id: ChartTimeframe;
  label: string;
  days: number;
  fetchDays: number;
  interval: CandleInterval;
  intraday?: boolean;
} {
  return {
    id: resolution.id,
    label: resolution.label,
    days: resolution.displayDays,
    fetchDays: resolution.fetchDays,
    interval: resolution.interval,
    intraday: isIntradayResolution(resolution),
  };
}

export function resolveTimeframeConfig(
  timeframe: ChartTimeframe,
  market: DetectedMarket = "unknown"
) {
  return toTimeframeConfig(resolveTimeframeResolution(timeframe, market));
}

export const TIMEFRAME_CONFIG = Object.fromEntries(
  TIMEFRAME_ORDER.map((tf) => [tf, toTimeframeConfig(BASE_RESOLUTION[tf])])
) as Record<
  ChartTimeframe,
  ReturnType<typeof toTimeframeConfig>
>;

export function getVisibleLogicalRange(
  resolution: TimeframeResolution,
  barCount: number
): { from: number; to: number } | null {
  if (barCount < 2) return null;

  const to = barCount - 1 + 2;

  switch (resolution.category) {
    case "tick":
      return { from: Math.max(0, barCount - 400), to };
    case "short":
      return { from: 0, to };
    case "swing":
      return { from: Math.max(0, barCount - 320), to };
    case "hourly":
      return { from: Math.max(0, barCount - 220), to };
    case "daily":
      return { from: Math.max(0, barCount - 180), to };
    default:
      return null;
  }
}

export function shouldFitContent(resolution: TimeframeResolution): boolean {
  return resolution.category === "short" || resolution.category === "daily";
}

export function resolveMarketFetchDays(
  market: DetectedMarket,
  timeframe: ChartTimeframe
): number {
  return resolveTimeframeResolution(timeframe, market).fetchDays;
}
