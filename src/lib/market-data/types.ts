export type MarketCategory =
  | "us"
  | "china"
  | "hk"
  | "fx"
  | "crypto"
  | "commodities";

export interface MarketSymbolDefinition {
  /** Stable internal id for i18n keys and quote map */
  id: string;
  /** Yahoo Finance ticker */
  symbol: string;
  /** Compact label for ticker bar */
  shortLabel: string;
  category: MarketCategory;
  /** VIX-style: up = red, down = green */
  invertColors?: boolean;
  priceDecimals?: number;
  /** Show in compact top ticker strip */
  tickerBar?: boolean;
}

export interface MarketQuote {
  id: string;
  symbol: string;
  shortLabel: string;
  category: MarketCategory;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  marketState?: string;
  updatedAt: number;
  invertColors?: boolean;
  priceDecimals?: number;
  /** Session / daily OHLCV from Yahoo regular market fields */
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  averageVolume?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  earningsTimestamp?: number;
  exchange?: string;
  fullExchangeName?: string;
  quoteType?: string;
  /** Crypto: 24h volume when provided by feed */
  volume24h?: number;
  /** Futures: contract month label or expiry hint */
  contractMonth?: string;
  openInterest?: number;
  /** FX / range helpers */
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface MarketQuoteError {
  symbol: string;
  id?: string;
  message: string;
}

export interface MarketSnapshot {
  quotes: Record<string, MarketQuote>;
  errors: MarketQuoteError[];
  fetchedAt: number;
  stale: boolean;
}

export interface ChartPoint {
  time: number;
  close: number;
}

export interface MarketChartSeries {
  symbol: string;
  points: ChartPoint[];
  changePercent: number;
}

export type MarketDataStatus = "idle" | "loading" | "success" | "error";

export interface MarketDataState {
  status: MarketDataStatus;
  snapshot: MarketSnapshot | null;
  previousQuotes: Record<string, MarketQuote>;
  chart: MarketChartSeries | null;
  lastError: string | null;
}
