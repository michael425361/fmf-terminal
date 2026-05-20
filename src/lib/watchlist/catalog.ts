import { searchChinaAShares } from "@/lib/market-data/china-a-share-search";
import { MARKET_SYMBOLS } from "@/lib/market-data/symbols";
import { CHINA_A_SHARE_CATALOG } from "./china-a-shares";
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
  {
    id: "hk-0700",
    symbol: "0700.HK",
    shortLabel: "0700",
    name: "Tencent Holdings",
    assetType: "hk_stock",
    category: "hk",
    priceDecimals: 2,
  },
];

function macroToCatalog(): AssetCatalogEntry[] {
  return MARKET_SYMBOLS.map((m) => ({
    id: m.id,
    symbol: m.symbol,
    shortLabel: m.shortLabel,
    name: m.shortLabel,
    assetType: mapCategoryToAssetType(m.category),
    category: m.category,
    invertColors: m.invertColors,
    priceDecimals: m.priceDecimals,
  }));
}

function mapCategoryToAssetType(
  category: string
): AssetCatalogEntry["assetType"] {
  switch (category) {
    case "us":
      return "index";
    case "china":
      return "cn_stock";
    case "hk":
      return "index";
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

  const cn = searchChinaAShares(q, limit).map((r) => r.entry);
  if (cn.length >= limit) return cn;

  const qLower = q.toLowerCase();
  const rest = ASSET_CATALOG.filter(
    (a) =>
      !cn.some((c) => c.id === a.id) &&
      (a.symbol.toLowerCase().includes(qLower) ||
        a.shortLabel.toLowerCase().includes(qLower) ||
        a.name.toLowerCase().includes(qLower) ||
        a.id.toLowerCase().includes(qLower))
  ).slice(0, limit - cn.length);

  return [...cn, ...rest];
}

export { resolveCatalogEntry, registerCatalogEntry } from "./catalog-registry";
