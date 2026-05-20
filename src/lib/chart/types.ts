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

export interface CandleSeriesResponse {
  symbol: string;
  timeframe: ChartTimeframe;
  bars: OHLCVBar[];
  change: number;
  changePercent: number;
  fetchedAt: number;
}

export interface ChartIndicatorState {
  ma20: boolean;
  ma50: boolean;
  vwap: boolean;
  volume: boolean;
}

export interface CrosshairData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
