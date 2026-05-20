import type { MarketCategory } from "./types";
import type { AssetCatalogEntry, AssetType } from "@/lib/watchlist/types";
import { CATALOG_BY_SYMBOL } from "@/lib/watchlist/catalog";

export interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
  exchDisp?: string;
  isYahooFinance?: boolean;
}

function slugSymbol(symbol: string): string {
  return symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function catalogIdFromSymbol(symbol: string): string {
  const existing = CATALOG_BY_SYMBOL[symbol.toUpperCase()];
  if (existing) return existing.id;
  return `sym-${slugSymbol(symbol)}`;
}

function inferFromExchange(exchange?: string): {
  category: MarketCategory | "etf";
  assetType: AssetType;
} {
  const ex = (exchange ?? "").toUpperCase();

  if (["SHH", "SHA", "SHE", "SHZ", "SS", "SZ"].some((e) => ex.includes(e))) {
    return { category: "china", assetType: "cn_stock" };
  }
  if (["HKG", "HK"].some((e) => ex.includes(e))) {
    return { category: "hk", assetType: "hk_stock" };
  }
  if (["CCC", "CRY"].some((e) => ex.includes(e))) {
    return { category: "crypto", assetType: "crypto" };
  }
  if (["CMX", "NYM", "CBT", "CME"].some((e) => ex.includes(e))) {
    return { category: "commodities", assetType: "commodity" };
  }
  if (["CCY", "FOREX"].some((e) => ex.includes(e))) {
    return { category: "fx", assetType: "forex" };
  }

  return { category: "us", assetType: "us_stock" };
}

function inferFromQuoteType(
  quoteType?: string,
  exchange?: string
): { category: MarketCategory | "etf"; assetType: AssetType } {
  const qt = (quoteType ?? "").toUpperCase();

  switch (qt) {
    case "ETF":
      return { category: "etf", assetType: "etf" };
    case "MUTUALFUND":
      return { category: "etf", assetType: "etf" };
    case "INDEX":
      return { category: "us", assetType: "index" };
    case "CRYPTOCURRENCY":
      return { category: "crypto", assetType: "crypto" };
    case "CURRENCY":
    case "FOREX":
      return { category: "fx", assetType: "forex" };
    case "FUTURE":
    case "COMMODITY":
      return { category: "commodities", assetType: "commodity" };
    case "EQUITY":
      return inferFromExchange(exchange);
    default:
      return inferFromExchange(exchange);
  }
}

export function yahooQuoteToCatalogEntry(
  quote: YahooSearchQuote
): AssetCatalogEntry | null {
  if (!quote.symbol || quote.isYahooFinance === false) return null;

  const symbol = quote.symbol.trim();
  if (!symbol) return null;

  const existing = CATALOG_BY_SYMBOL[symbol.toUpperCase()];
  if (existing) return existing;

  const name =
    quote.longname?.trim() ||
    quote.shortname?.trim() ||
    symbol;

  const shortLabel = symbol.includes(".")
    ? symbol.split(".")[0]
    : symbol.length <= 6
      ? symbol
      : symbol.slice(0, 8);

  const { category, assetType } = inferFromQuoteType(
    quote.quoteType,
    quote.exchange
  );

  const priceDecimals =
    category === "fx" ? 4 : category === "crypto" ? 2 : 2;

  return {
    id: catalogIdFromSymbol(symbol),
    symbol,
    shortLabel,
    name,
    assetType,
    category,
    priceDecimals,
  };
}
