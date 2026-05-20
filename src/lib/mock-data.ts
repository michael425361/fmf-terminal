export type AssetClass =
  | "us_equity"
  | "cn_equity"
  | "options"
  | "forex"
  | "commodity"
  | "crypto";

export interface TickerQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

export interface WatchlistItem {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap?: string;
}

export interface CalendarEvent {
  id: string;
  time: string;
  country: string;
  impact: "high" | "medium" | "low";
  previous?: string;
  forecast?: string;
  actual?: string;
}

export const topBarTickers: TickerQuote[] = [
  { symbol: "SPY", price: 528.42, change: 3.18, changePct: 0.61 },
  { symbol: "QQQ", price: 451.87, change: -1.24, changePct: -0.27 },
  { symbol: "BTC", price: 67240.5, change: 1240.8, changePct: 1.88 },
  { symbol: "GOLD", price: 2348.6, change: 12.4, changePct: 0.53 },
  { symbol: "VIX", price: 13.82, change: -0.45, changePct: -3.15 },
];

export const watchlist: WatchlistItem[] = [
  {
    symbol: "AAPL",
    assetClass: "us_equity",
    price: 189.84,
    change: 2.31,
    changePct: 1.23,
    volume: "48.2M",
    marketCap: "2.92T",
  },
  {
    symbol: "NVDA",
    assetClass: "us_equity",
    price: 924.56,
    change: -8.42,
    changePct: -0.9,
    volume: "32.1M",
    marketCap: "2.28T",
  },
  {
    symbol: "600519",
    assetClass: "cn_equity",
    price: 1688.0,
    change: 15.5,
    changePct: 0.93,
    volume: "1.2M",
    marketCap: "2.1T CNY",
  },
  {
    symbol: "SPX 5200C",
    assetClass: "options",
    price: 18.45,
    change: 1.2,
    changePct: 6.95,
    volume: "12.4K",
  },
  {
    symbol: "EUR/USD",
    assetClass: "forex",
    price: 1.0842,
    change: -0.0018,
    changePct: -0.17,
    volume: "—",
  },
  {
    symbol: "CL",
    assetClass: "commodity",
    price: 78.34,
    change: 0.92,
    changePct: 1.19,
    volume: "245K",
  },
  {
    symbol: "ETH",
    assetClass: "crypto",
    price: 3421.18,
    change: 48.6,
    changePct: 1.44,
    volume: "18.4B",
  },
  {
    symbol: "TSLA",
    assetClass: "us_equity",
    price: 248.12,
    change: -3.88,
    changePct: -1.54,
    volume: "89.5M",
    marketCap: "789B",
  },
];

export const aiMarketSummary = {
  confidence: 72,
  bulletCount: 5,
  highlightKeys: ["breadth", "sectorLead", "fx", "rates"] as const,
  highlightTones: ["positive", "positive", "neutral", "positive"] as const,
};

export const economicCalendar: CalendarEvent[] = [
  {
    id: "1",
    time: "08:30",
    country: "US",
    impact: "medium",
    previous: "215K",
    forecast: "212K",
    actual: "210K",
  },
  {
    id: "2",
    time: "10:00",
    country: "US",
    impact: "medium",
    previous: "4.19M",
    forecast: "4.22M",
  },
  {
    id: "3",
    time: "14:00",
    country: "US",
    impact: "high",
    previous: "—",
    forecast: "—",
  },
  {
    id: "4",
    time: "21:30",
    country: "CN",
    impact: "high",
    previous: "3.45%",
    forecast: "3.45%",
  },
  {
    id: "5",
    time: "23:00",
    country: "EU",
    impact: "medium",
    forecast: "—",
  },
];

export const portfolioSnapshot = {
  totalValue: 284_520.45,
  dayPnl: 3240.18,
  dayPnlPct: 1.15,
  openPositions: 14,
  cash: 42_180.0,
};
