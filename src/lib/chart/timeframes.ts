import type { ChartTimeframe } from "./types";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";

export type YahooChartInterval = TimeframeConfig["interval"];

export interface TimeframeConfig {
  id: ChartTimeframe;
  label: string;
  days: number;
  interval: YahooChartInterval;
  /** Intraday bars (session filtering + density tuning). */
  intraday?: boolean;
}

/** Default interval mapping (TradingView-style density). */
export const TIMEFRAME_CONFIG: Record<ChartTimeframe, TimeframeConfig> = {
  "1D": { id: "1D", label: "1D", days: 1, interval: "5m", intraday: true },
  "5D": { id: "5D", label: "5D", days: 5, interval: "30m", intraday: true },
  "1M": { id: "1M", label: "1M", days: 30, interval: "1d" },
  "3M": { id: "3M", label: "3M", days: 90, interval: "1d" },
  "6M": { id: "6M", label: "6M", days: 180, interval: "1d" },
  "1Y": { id: "1Y", label: "1Y", days: 365, interval: "1wk" },
};

/** Slightly denser intraday for HK/TW regular sessions. */
const ASIA_INTRADAY_OVERRIDES: Partial<
  Record<ChartTimeframe, Pick<TimeframeConfig, "interval" | "days">>
> = {
  "1D": { interval: "5m", days: 1 },
  "5D": { interval: "30m", days: 5 },
};

export const TIMEFRAME_ORDER: ChartTimeframe[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
];

export function resolveTimeframeConfig(
  timeframe: ChartTimeframe,
  market?: DetectedMarket
): TimeframeConfig {
  const base = TIMEFRAME_CONFIG[timeframe];
  if (market !== "hk" && market !== "tw") {
    return base;
  }

  const asia = ASIA_INTRADAY_OVERRIDES[timeframe];
  if (!asia) return base;

  return {
    ...base,
    ...asia,
    intraday: base.intraday,
  };
}

export function isIntradayTimeframe(timeframe: ChartTimeframe): boolean {
  return Boolean(TIMEFRAME_CONFIG[timeframe].intraday);
}
