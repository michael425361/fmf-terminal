import type { YahooChartInterval } from "@/lib/chart/timeframes";
import type { ChartTimeframe } from "@/lib/chart/types";
import type { DetectedMarket } from "../symbol-normalize";

export interface GetCandlesParams {
  symbol: string;
  market?: DetectedMarket;
  interval: YahooChartInterval;
  /** Used for session trim + cache key when called from chart UI. */
  timeframe?: ChartTimeframe;
  fetchDays?: number;
  includePrePost?: boolean;
}
