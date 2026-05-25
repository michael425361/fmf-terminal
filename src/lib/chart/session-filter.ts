import type { ChartTimeframe, OHLCVBar } from "./types";
import {
  resolveTimeframeResolution,
  type TimeframeResolution,
} from "./timeframe-resolution";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import {
  filterSessionBars,
  getMarketTimezone,
} from "@/lib/market-data/session-filter";

export { getMarketTimezone, filterSessionBars };

export interface PreparedChartBars {
  bars: OHLCVBar[];
  realTimeByDisplay: Map<number, number>;
}

const GAP_MULTIPLIER = 2.5;

function compressSessionGaps(
  bars: OHLCVBar[],
  resolution: TimeframeResolution
): { bars: OHLCVBar[]; realTimeByDisplay: Map<number, number> } {
  const threshold = Math.max(
    resolution.barPeriodSeconds * GAP_MULTIPLIER,
    90 * 60
  );
  const realTimeByDisplay = new Map<number, number>();
  const out: OHLCVBar[] = [];

  let displayTime = bars[0].time;
  realTimeByDisplay.set(displayTime, bars[0].time);
  out.push({ ...bars[0], time: displayTime });

  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1];
    const bar = bars[i];
    const delta = bar.time - prev.time;
    const step =
      delta > threshold
        ? Math.min(delta, threshold)
        : Math.max(delta, 1);
    displayTime += step;
    realTimeByDisplay.set(displayTime, bar.time);
    out.push({ ...bar, time: displayTime });
  }

  return { bars: out, realTimeByDisplay };
}

/**
 * Client-side chart prep: optional session-gap compression for multi-day intraday.
 */
export function prepareChartBars(
  bars: OHLCVBar[],
  market: DetectedMarket,
  timeframe: ChartTimeframe
): PreparedChartBars {
  const resolution = resolveTimeframeResolution(timeframe, market);
  let filtered = bars;

  if (resolution.filterSession) {
    filtered = filterSessionBars(bars, market, timeframe);
  }

  if (resolution.compressSessionGaps && filtered.length >= 2) {
    return compressSessionGaps(filtered, resolution);
  }

  const realTimeByDisplay = new Map<number, number>();
  for (const b of filtered) {
    realTimeByDisplay.set(b.time, b.time);
  }
  return { bars: filtered, realTimeByDisplay };
}

export function resolveRealTime(
  displayTime: number,
  lookup: Map<number, number>
): number {
  return lookup.get(displayTime) ?? displayTime;
}
