import type { AssetCatalogEntry } from "./types";
import { getChinaAShareDef } from "./china-a-shares";
import { getHKStockDef } from "./hk-stocks";
import { getTWStockDef } from "./tw-stocks";

export type MarketBadgeCode = "US" | "CN" | "HK" | "TW";

export function getMarketBadge(entry: AssetCatalogEntry): MarketBadgeCode {
  if (entry.assetType === "cn_stock" || entry.category === "china") return "CN";
  if (entry.assetType === "tw_stock" || entry.category === "tw") return "TW";
  if (
    entry.assetType === "hk_stock" ||
    entry.category === "hk" ||
    entry.symbol.toUpperCase().endsWith(".HK") ||
    entry.id.startsWith("hk-")
  ) {
    return "HK";
  }
  return "US";
}

export const MARKET_BADGE_STYLES: Record<
  MarketBadgeCode,
  string
> = {
  US: "border-blue-400/40 bg-blue-500/10 text-blue-300",
  CN: "border-red-400/40 bg-red-500/10 text-red-300",
  HK: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  TW: "border-teal-400/40 bg-teal-500/10 text-teal-300",
};

export function getCatalogDisplayName(
  entry: AssetCatalogEntry,
  locale: string
): string {
  const zh = locale === "zh";
  const cn = getChinaAShareDef(entry.id);
  if (cn) return zh ? cn.nameZh : cn.nameEn;
  const hk = getHKStockDef(entry.id);
  if (hk) return zh ? hk.nameZh : hk.nameEn;
  const tw = getTWStockDef(entry.id);
  if (tw) return zh ? tw.nameZh : tw.nameEn;
  return entry.name;
}
