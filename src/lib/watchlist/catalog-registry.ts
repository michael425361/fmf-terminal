import type { AssetCatalogEntry } from "./types";
import { CATALOG_BY_ID, CATALOG_BY_SYMBOL } from "./catalog";

const dynamicById = new Map<string, AssetCatalogEntry>();
const dynamicBySymbol = new Map<string, AssetCatalogEntry>();

/** Register a Yahoo (or other) search result for watchlist / chart resolution. */
export function registerCatalogEntry(entry: AssetCatalogEntry): void {
  dynamicById.set(entry.id, entry);
  dynamicBySymbol.set(entry.symbol.toUpperCase(), entry);
}

export function getCatalogEntryById(id: string): AssetCatalogEntry | undefined {
  return CATALOG_BY_ID[id] ?? dynamicById.get(id);
}

export function getCatalogEntryBySymbol(
  symbol: string
): AssetCatalogEntry | undefined {
  const key = symbol.trim().toUpperCase();
  return CATALOG_BY_SYMBOL[key] ?? dynamicBySymbol.get(key);
}

export function resolveCatalogEntry(
  symbolOrId: string
): AssetCatalogEntry | undefined {
  const key = symbolOrId.trim();
  return (
    getCatalogEntryById(key) ??
    getCatalogEntryBySymbol(key) ??
    getCatalogEntryBySymbol(key.toUpperCase())
  );
}
