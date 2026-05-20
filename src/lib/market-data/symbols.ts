import type { MarketCategory, MarketSymbolDefinition } from "./types";

export const MARKET_SYMBOLS: MarketSymbolDefinition[] = [
  // US Indexes
  { id: "us-gspc", symbol: "^GSPC", shortLabel: "SPX", category: "us", tickerBar: true },
  { id: "us-ixic", symbol: "^IXIC", shortLabel: "NDX", category: "us", tickerBar: true },
  { id: "us-dji", symbol: "^DJI", shortLabel: "DJI", category: "us" },
  { id: "us-rut", symbol: "^RUT", shortLabel: "RUT", category: "us" },
  {
    id: "us-vix",
    symbol: "^VIX",
    shortLabel: "VIX",
    category: "us",
    invertColors: true,
    tickerBar: true,
    priceDecimals: 2,
  },

  // China Indexes
  {
    id: "cn-shcomp",
    symbol: "000001.SS",
    shortLabel: "SSE",
    category: "china",
    tickerBar: true,
    priceDecimals: 2,
  },
  {
    id: "cn-szcomp",
    symbol: "399001.SZ",
    shortLabel: "SZCI",
    category: "china",
    tickerBar: true,
    priceDecimals: 2,
  },
  {
    id: "cn-chinext",
    symbol: "399006.SZ",
    shortLabel: "ChiNext",
    category: "china",
    tickerBar: true,
    priceDecimals: 2,
  },

  // Hong Kong
  { id: "hk-hsi", symbol: "^HSI", shortLabel: "HSI", category: "hk", tickerBar: true, priceDecimals: 2 },

  // Forex / Macro
  {
    id: "fx-dxy",
    symbol: "DX-Y.NYB",
    shortLabel: "DXY",
    category: "fx",
    tickerBar: true,
    priceDecimals: 3,
  },
  { id: "fx-eurusd", symbol: "EURUSD=X", shortLabel: "EUR/USD", category: "fx", priceDecimals: 5 },
  { id: "fx-usdjpy", symbol: "USDJPY=X", shortLabel: "USD/JPY", category: "fx", priceDecimals: 3 },
  { id: "fx-audusd", symbol: "AUDUSD=X", shortLabel: "AUD/USD", category: "fx", priceDecimals: 5 },
  { id: "fx-usdcnh", symbol: "USDCNH=X", shortLabel: "USD/CNH", category: "fx", priceDecimals: 4 },

  // Crypto
  { id: "crypto-btc", symbol: "BTC-USD", shortLabel: "BTC", category: "crypto", tickerBar: true },
  { id: "crypto-eth", symbol: "ETH-USD", shortLabel: "ETH", category: "crypto", tickerBar: true },

  // Commodities
  { id: "cmd-gold", symbol: "GC=F", shortLabel: "GOLD", category: "commodities", tickerBar: true, priceDecimals: 2 },
  { id: "cmd-silver", symbol: "SI=F", shortLabel: "SILV", category: "commodities", priceDecimals: 3 },
  { id: "cmd-wti", symbol: "CL=F", shortLabel: "WTI", category: "commodities", tickerBar: true, priceDecimals: 2 },
  { id: "cmd-brent", symbol: "BZ=F", shortLabel: "BRENT", category: "commodities", priceDecimals: 2 },
  { id: "cmd-ng", symbol: "NG=F", shortLabel: "NGAS", category: "commodities", priceDecimals: 3 },
  { id: "cmd-copper", symbol: "HG=F", shortLabel: "CU", category: "commodities", priceDecimals: 3 },
  { id: "cmd-wheat", symbol: "ZW=F", shortLabel: "WHEAT", category: "commodities", priceDecimals: 2 },
  { id: "cmd-corn", symbol: "ZC=F", shortLabel: "CORN", category: "commodities", priceDecimals: 2 },
  { id: "cmd-soy", symbol: "ZS=F", shortLabel: "SOY", category: "commodities", priceDecimals: 2 },
];

export const TICKER_BAR_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.tickerBar);

export const CATEGORY_ORDER: MarketCategory[] = [
  "us",
  "china",
  "hk",
  "fx",
  "crypto",
  "commodities",
];

export const SYMBOL_BY_ID = Object.fromEntries(
  MARKET_SYMBOLS.map((s) => [s.id, s])
) as Record<string, MarketSymbolDefinition>;

export const SYMBOL_BY_YAHOO = Object.fromEntries(
  MARKET_SYMBOLS.map((s) => [s.symbol, s])
) as Record<string, MarketSymbolDefinition>;

export const DEFAULT_CHART_SYMBOL = "^GSPC";
