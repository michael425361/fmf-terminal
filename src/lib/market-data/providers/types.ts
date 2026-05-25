import type { OHLCVBar } from "@/lib/chart/types";
import type { YahooChartInterval } from "@/lib/chart/timeframes";
import type { DetectedMarket } from "../symbol-normalize";

export type CandleProviderId =
  | "yahoo"
  | "finnhub"
  | "twelvedata"
  | "binance";

export interface ProviderFetchContext {
  /** Canonical symbol (e.g. 0700.HK, AMD, BTC-USD). */
  symbol: string;
  market: DetectedMarket;
  interval: YahooChartInterval;
  fetchDays: number;
  includePrePost: boolean;
}

export interface ProviderCandleResult {
  provider: CandleProviderId;
  symbol: string;
  bars: OHLCVBar[];
  timezone?: string;
}

export interface CandleProvider {
  id: CandleProviderId;
  fetch(ctx: ProviderFetchContext): Promise<ProviderCandleResult | null>;
}
