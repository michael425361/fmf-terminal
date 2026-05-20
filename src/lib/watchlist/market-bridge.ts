import type { MarketCategory, MarketSymbolDefinition } from "@/lib/market-data/types";
import type { AssetCatalogEntry } from "./types";

export function catalogToMarketDef(entry: AssetCatalogEntry): MarketSymbolDefinition {
  const category: MarketCategory =
    entry.category === "etf" ? "us" : (entry.category as MarketCategory);

  return {
    id: entry.id,
    symbol: entry.symbol,
    shortLabel: entry.shortLabel,
    category,
    invertColors: entry.invertColors,
    priceDecimals: entry.priceDecimals,
  };
}
