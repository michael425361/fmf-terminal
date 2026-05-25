import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import type { OHLCVBar } from "@/lib/chart/types";
import type { AISummaryLocale } from "./locale";

export type MarketSummarySentiment = "bullish" | "bearish" | "neutral";

export interface MarketSummaryQuoteInput {
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  shortLabel?: string;
  name?: string;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  averageVolume?: number;
}

export interface MarketSummaryIndicators {
  lastClose: number | null;
  ma20: number | null;
  ma50: number | null;
  rsi14: number | null;
  priceVsMa20: "above" | "below" | "at" | null;
  volume: number | null;
  avgVolume20: number | null;
  volumeVsAvg20: "above" | "below" | "inline" | null;
}

export interface MarketSummaryRequest {
  symbol: string;
  market: DetectedMarket;
  locale?: AISummaryLocale;
  quote?: MarketSummaryQuoteInput | null;
  candles?: OHLCVBar[];
  indicators?: MarketSummaryIndicators;
}

export interface MarketSummaryResponse {
  summary: string;
  sentiment: MarketSummarySentiment;
  highlights: string[];
  locale?: AISummaryLocale;
  cached?: boolean;
  generatedAt?: number;
  unavailable?: boolean;
  message?: string;
}
