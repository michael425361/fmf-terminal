import { searchChinaAShares } from "@/lib/market-data/china-a-share-search";
import { searchHKStocks } from "@/lib/market-data/hk-stock-search";
import { searchTWStocks } from "@/lib/market-data/tw-stock-search";
import { MARKET_SYMBOLS } from "@/lib/market-data/symbols";
import { CHINA_A_SHARE_CATALOG } from "./china-a-shares";
import { HK_STOCK_CATALOG } from "./hk-stocks";
import { TW_STOCK_CATALOG } from "./tw-stocks";
import type { AssetCatalogEntry } from "./types";

const EXTRA_ASSETS: AssetCatalogEntry[] = [
  {
    id: "etf-spy",
    symbol: "SPY",
    shortLabel: "SPY",
    name: "SPDR S&P 500 ETF",
    assetType: "etf",
    category: "etf",
  },
  {
    id: "etf-qqq",
    symbol: "QQQ",
    shortLabel: "QQQ",
    name: "Invesco QQQ Trust",
    assetType: "etf",
    category: "etf",
  },
  {
    id: "us-amd",
    symbol: "AMD",
    shortLabel: "AMD",
    name: "Advanced Micro Devices",
    assetType: "us_stock",
    category: "us",
  },
  {
    id: "us-nvda",
    symbol: "NVDA",
    shortLabel: "NVDA",
    name: "NVIDIA Corporation",
    assetType: "us_stock",
    category: "us",
  },
  {
    id: "us-tsla",
    symbol: "TSLA",
    shortLabel: "TSLA",
    name: "Tesla Inc.",
    assetType: "us_stock",
    category: "us",
  },
];

function macroToCatalog(): AssetCatalogEntry[] {
  return MARKET_SYMBOLS.map((m) => ({
    id: m.id,
    symbol: m.symbol,
    shortLabel: m.shortLabel,
    name: m.shortLabel,
    assetType: mapCategoryToAssetType(m.category, m.symbol),
    category: m.category,
    invertColors: m.invertColors,
    priceDecimals: m.priceDecimals,
  }));
}

function mapCategoryToAssetType(
  category: string,
  symbol: string
): AssetCatalogEntry["assetType"] {
  if (symbol.startsWith("^")) return "index";
  switch (category) {
    case "us":
      return "index";
    case "china":
      return "cn_stock";
    case "hk":
      return "hk_stock";
    case "tw":
      return "tw_stock";
    case "fx":
      return "forex";
    case "crypto":
      return "crypto";
    case "commodities":
      return "commodity";
    default:
      return "us_stock";
  }
}

export const ASSET_CATALOG: AssetCatalogEntry[] = [
  ...EXTRA_ASSETS,
  ...CHINA_A_SHARE_CATALOG,
  ...HK_STOCK_CATALOG,
  ...TW_STOCK_CATALOG,
  ...macroToCatalog(),
];

export const CATALOG_BY_ID = Object.fromEntries(
  ASSET_CATALOG.map((a) => [a.id, a])
) as Record<string, AssetCatalogEntry>;

export const CATALOG_BY_SYMBOL = Object.fromEntries(
  ASSET_CATALOG.map((a) => [a.symbol.toUpperCase(), a])
) as Record<string, AssetCatalogEntry>;

export function searchCatalog(query: string, limit = 12): AssetCatalogEntry[] {
  const q = query.trim();
  if (!q) return [];

  const perMarket = Math.max(4, Math.ceil(limit / 3));
  const cn = searchChinaAShares(q, perMarket).map((r) => r.entry);
  const hk = searchHKStocks(q, perMarket).map((r) => r.entry);
  const tw = searchTWStocks(q, perMarket).map((r) => r.entry);

  const seen = new Set<string>();
  const merged: AssetCatalogEntry[] = [];

  for (const entry of [...cn, ...hk, ...tw]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
    if (merged.length >= limit) return merged;
  }

  const qLower = q.toLowerCase();
  const rest = ASSET_CATALOG.filter(
    (a) =>
      !seen.has(a.id) &&
      (a.symbol.toLowerCase().includes(qLower) ||
        a.shortLabel.toLowerCase().includes(qLower) ||
        a.name.toLowerCase().includes(qLower) ||
        a.id.toLowerCase().includes(qLower))
  ).slice(0, limit - merged.length);

  return [...merged, ...rest];
}

export { resolveCatalogEntry, registerCatalogEntry } from "./catalog-registry";
