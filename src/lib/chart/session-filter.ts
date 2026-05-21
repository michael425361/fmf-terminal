import type { ChartTimeframe, OHLCVBar } from "./types";
import { isIntradayTimeframe } from "./timeframes";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import {
  filterSessionBars,
  getMarketTimezone,
} from "@/lib/market-data/session-filter";

export { getMarketTimezone, filterSessionBars };

/** Max gap (seconds) before compressing lunch/overnight on intraday charts. */
const INTRADAY_GAP_THRESHOLD: Record<ChartTimeframe, number> = {
  "1D": 20 * 60,
  "5D": 90 * 60,
  "1M": 0,
  "3M": 0,
  "6M": 0,
  "1Y": 0,
};

export interface PreparedChartBars {
  bars: OHLCVBar[];
  /** display time (chart axis) → real UTC seconds */
  realTimeByDisplay: Map<number, number>;
}

/**
 * Filter to regular sessions, then compress lunch/overnight gaps for intraday
 * while preserving real timestamps for tooltips via realTimeByDisplay.
 */
export function prepareChartBars(
  bars: OHLCVBar[],
  market: DetectedMarket,
  timeframe: ChartTimeframe
): PreparedChartBars {
  const filtered = filterSessionBars(bars, market, timeframe);

  if (!isIntradayTimeframe(timeframe) || filtered.length < 2) {
    const identity = new Map<number, number>();
    for (const b of filtered) identity.set(b.time, b.time);
    return { bars: filtered, realTimeByDisplay: identity };
  }

  const threshold = INTRADAY_GAP_THRESHOLD[timeframe];
  if (!threshold) {
    const identity = new Map<number, number>();
    for (const b of filtered) identity.set(b.time, b.time);
    return { bars: filtered, realTimeByDisplay: identity };
  }

  const realTimeByDisplay = new Map<number, number>();
  const out: OHLCVBar[] = [];
  let displayTime = filtered[0].time;
  realTimeByDisplay.set(displayTime, filtered[0].time);
  out.push({ ...filtered[0], time: displayTime });

  for (let i = 1; i < filtered.length; i++) {
    const prev = filtered[i - 1];
    const bar = filtered[i];
    const delta = bar.time - prev.time;
    const step =
      delta > threshold
        ? Math.min(delta, threshold)
        : delta;
    displayTime += Math.max(step, 1);
    realTimeByDisplay.set(displayTime, bar.time);
    out.push({ ...bar, time: displayTime });
  }

  return { bars: out, realTimeByDisplay };
}

export function resolveRealTime(
  displayTime: number,
  lookup: Map<number, number>
): number {
  return lookup.get(displayTime) ?? displayTime;
}
