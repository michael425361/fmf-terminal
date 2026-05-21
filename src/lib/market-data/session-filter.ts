import type { ChartTimeframe, OHLCVBar } from "@/lib/chart/types";
import { isIntradayTimeframe } from "@/lib/chart/timeframes";
import type { DetectedMarket } from "./symbol-normalize";

const MARKET_TIMEZONE: Record<"us" | "hk" | "tw" | "cn", string> = {
  us: "America/New_York",
  hk: "Asia/Hong_Kong",
  tw: "Asia/Taipei",
  cn: "Asia/Shanghai",
};

interface LocalClock {
  weekday: number;
  hour: number;
  minute: number;
}

function getLocalClock(unixSec: number, timeZone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
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
    hour,
    minute,
  };
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function isWeekend(clock: LocalClock): boolean {
  return clock.weekday === 0 || clock.weekday === 6;
}

function isHKRegularSession(clock: LocalClock): boolean {
  if (isWeekend(clock)) return false;
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  const morning = m >= 9 * 60 + 30 && m < 12 * 60;
  const afternoon = m >= 13 * 60 && m <= 16 * 60;
  return morning || afternoon;
}

function isTWRegularSession(clock: LocalClock): boolean {
  if (isWeekend(clock)) return false;
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  const morning = m >= 9 * 60 && m < 13 * 60 + 30;
  const afternoon = m >= 14 * 60 && m <= 15 * 60 + 30;
  return morning || afternoon;
}

function isUSRegularSession(clock: LocalClock): boolean {
  if (isWeekend(clock)) return false;
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  return m >= 9 * 60 + 30 && m < 16 * 60;
}

function isCNRegularSession(clock: LocalClock): boolean {
  if (isWeekend(clock)) return false;
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  const morning = m >= 9 * 60 + 30 && m < 11 * 60 + 30;
  const afternoon = m >= 13 * 60 && m <= 15 * 60;
  return morning || afternoon;
}

function isInRegularSession(
  unixSec: number,
  market: "us" | "hk" | "tw" | "cn"
): boolean {
  const tz = MARKET_TIMEZONE[market];
  const clock = getLocalClock(unixSec, tz);
  switch (market) {
    case "hk":
      return isHKRegularSession(clock);
    case "tw":
      return isTWRegularSession(clock);
    case "us":
      return isUSRegularSession(clock);
    case "cn":
      return isCNRegularSession(clock);
    default:
      return false;
  }
}

/**
 * Keep only regular-session intraday bars (exchange-local clocks).
 * Excludes lunch breaks and off-hours; preserves monotonic UTC timestamps.
 */
export function filterSessionBars(
  bars: OHLCVBar[],
  market: DetectedMarket,
  timeframe: ChartTimeframe
): OHLCVBar[] {
  const sessionMarket =
    market === "hk" || market === "tw" || market === "us" || market === "cn"
      ? market
      : null;

  if (!sessionMarket || !isIntradayTimeframe(timeframe)) return bars;

  const filtered = bars.filter((b) =>
    isInRegularSession(b.time, sessionMarket)
  );

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
  if (market === "hk") return MARKET_TIMEZONE.hk;
  if (market === "tw") return MARKET_TIMEZONE.tw;
  if (market === "us") return MARKET_TIMEZONE.us;
  if (market === "cn") return MARKET_TIMEZONE.cn;
  return undefined;
}
