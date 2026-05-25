import type { ChartTimeframe, OHLCVBar } from "@/lib/chart/types";
import { resolveTimeframeResolution } from "@/lib/chart/timeframe-resolution";
import type { DetectedMarket } from "./symbol-normalize";
import {
  getChartMarketConfig,
  parseSessionMinutes,
  type SessionWindow,
} from "@/lib/chart/market-config";

interface LocalClock {
  weekday: number;
  hour: number;
  minute: number;
}

/** Exchange-local wall clock from a UTC unix timestamp. */
export function getLocalClock(unixSec: number, timeZone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(unixSec * 1000));

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    weekday: weekdayMap[weekdayStr] ?? 1,
    hour: hour === 24 ? 0 : hour,
    minute,
  };
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function isWeekend(clock: LocalClock): boolean {
  return clock.weekday === 0 || clock.weekday === 6;
}

function isInSessionWindow(
  clock: LocalClock,
  sessions: SessionWindow[]
): boolean {
  if (isWeekend(clock) || sessions.length === 0) return false;
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  return sessions.some((s) => {
    const start = parseSessionMinutes(s.start);
    const end = parseSessionMinutes(s.end);
    return m >= start && m <= end;
  });
}

function isInRegularSession(
  unixSec: number,
  market: DetectedMarket
): boolean {
  const cfg = getChartMarketConfig(market);
  if (!cfg.filterIntradaySession || cfg.sessions.length === 0) {
    return true;
  }
  if (market === "crypto") return true;
  const clock = getLocalClock(unixSec, cfg.timezone);
  return isInSessionWindow(clock, cfg.sessions);
}

/**
 * Keep only regular-session intraday bars (exchange-local clocks).
 * HK: 09:30–12:00, 13:00–16:00. Preserves real UTC timestamps for the chart axis.
 */
export function filterSessionBars(
  bars: OHLCVBar[],
  market: DetectedMarket,
  timeframe: ChartTimeframe
): OHLCVBar[] {
  const cfg = getChartMarketConfig(market);
  const resolution = resolveTimeframeResolution(timeframe, market);
  if (!cfg.filterIntradaySession || !resolution.filterSession) {
    return bars;
  }

  const filtered = bars.filter((b) => isInRegularSession(b.time, market));

  if (filtered.length >= 2) return filtered;

  return bars.length >= 2 ? bars : filtered;
}

/** @deprecated Use filterSessionBars */
export function filterAsiaSessionBars(
  bars: OHLCVBar[],
  market: DetectedMarket,
  timeframe: ChartTimeframe
): OHLCVBar[] {
  return filterSessionBars(bars, market, timeframe);
}

export function getMarketTimezone(market: DetectedMarket): string | undefined {
  const cfg = getChartMarketConfig(market);
  return cfg.timezone === "UTC" && market === "unknown"
    ? undefined
    : cfg.timezone;
}
