import type { MarketCategory, MarketSymbolDefinition } from "@/lib/market-data/types";
import { normalizeYahooSymbol } from "@/lib/market-data/symbol-normalize";
import type { AssetCatalogEntry } from "./types";

export function catalogToMarketDef(entry: AssetCatalogEntry): MarketSymbolDefinition {
  const category: MarketCategory =
    entry.category === "etf" ? "us" : (entry.category as MarketCategory);

  return {
    id: entry.id,
    symbol: normalizeYahooSymbol(entry.symbol),
    shortLabel: entry.shortLabel,
    category,
    invertColors: entry.invertColors,
    priceDecimals: entry.priceDecimals,
  };
}
