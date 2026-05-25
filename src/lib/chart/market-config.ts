import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import type { ChartTimeframe } from "./types";

/** Exchange-local session window (inclusive start, inclusive end). */
export interface SessionWindow {
  start: string;
  end: string;
}

export interface MarketChartConfig {
  market: DetectedMarket;
  timezone: string;
  sessions: SessionWindow[];
  filterIntradaySession: boolean;
  /** Wider Yahoo/provider intraday window (calendar days). */
  minIntradayFetchDays: number;
  /** Include pre/post for US intraday. */
  includePrePost: boolean;
}

const HK_SESSIONS: SessionWindow[] = [
  { start: "09:30", end: "12:00" },
  { start: "13:00", end: "16:00" },
];

const TW_SESSIONS: SessionWindow[] = [
  { start: "09:00", end: "13:30" },
  { start: "14:00", end: "15:30" },
];

const US_SESSIONS: SessionWindow[] = [
  { start: "04:00", end: "20:00" },
];

const CN_SESSIONS: SessionWindow[] = [
  { start: "09:30", end: "11:30" },
  { start: "13:00", end: "15:00" },
];

export const MARKET_CHART_CONFIG: Record<DetectedMarket, MarketChartConfig> = {
  hk: {
    market: "hk",
    timezone: "Asia/Hong_Kong",
    sessions: HK_SESSIONS,
    filterIntradaySession: true,
    minIntradayFetchDays: 14,
    includePrePost: false,
  },
  tw: {
    market: "tw",
    timezone: "Asia/Taipei",
    sessions: TW_SESSIONS,
    filterIntradaySession: true,
    minIntradayFetchDays: 12,
    includePrePost: false,
  },
  us: {
    market: "us",
    timezone: "America/New_York",
    sessions: US_SESSIONS,
    filterIntradaySession: false,
    minIntradayFetchDays: 7,
    includePrePost: true,
  },
  cn: {
    market: "cn",
    timezone: "Asia/Shanghai",
    sessions: CN_SESSIONS,
    filterIntradaySession: true,
    minIntradayFetchDays: 10,
    includePrePost: false,
  },
  crypto: {
    market: "crypto",
    timezone: "UTC",
    sessions: [],
    filterIntradaySession: false,
    minIntradayFetchDays: 7,
    includePrePost: false,
  },
  unknown: {
    market: "unknown",
    timezone: "UTC",
    sessions: [],
    filterIntradaySession: false,
    minIntradayFetchDays: 7,
    includePrePost: false,
  },
};

export function getChartMarketConfig(
  market: DetectedMarket
): MarketChartConfig {
  return MARKET_CHART_CONFIG[market] ?? MARKET_CHART_CONFIG.unknown;
}

export function getChartTimezone(
  market: DetectedMarket,
  exchangeFallback?: string
): string {
  if (market !== "unknown") {
    return getChartMarketConfig(market).timezone;
  }
  return exchangeFallback ?? "UTC";
}

export function shouldIncludePrePost(
  market: DetectedMarket,
  timeframe: ChartTimeframe
): boolean {
  const intraday = timeframe === "1D" || timeframe === "5D";
  if (!intraday) return false;
  return getChartMarketConfig(market).includePrePost;
}

export function parseSessionMinutes(hm: string): number {
  const [h, m] = hm.split(":").map((x) => Number(x));
  return h * 60 + (m || 0);
}
