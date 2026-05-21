export type ChartType = "candlestick" | "area" | "line";

export type ChartTimeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y";

export interface OHLCVBar {
  time: number; // UTCTimestamp seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleDebugMeta {
  symbol: string;
  resolvedSymbol: string;
  interval: string;
  candleCount: number;
  rawCount?: number;
  rejectedCount?: number;
  isFallback: boolean;
  timezone?: string;
  market?: string;
}

export interface CandleSeriesResponse {
  symbol: string;
  timeframe: ChartTimeframe;
  bars: OHLCVBar[];
  change: number;
  changePercent: number;
  fetchedAt: number;
  debug?: CandleDebugMeta;
}

export interface ChartIndicatorState {
  ma20: boolean;
  ma50: boolean;
  vwap: boolean;
  volume: boolean;
  rsi: boolean;
}

export interface CrosshairData {
  time: number;
  /** Wall-clock UTC seconds when chart uses compressed session time */
  realTime?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
