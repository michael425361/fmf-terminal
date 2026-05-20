"use client";

import { useTranslations } from "next-intl";
import type { MarketQuote } from "@/lib/market-data/types";
import { resolveExchangeCode } from "@/lib/chart/header-metrics";
import type { AssetType, WatchlistItemView } from "@/lib/watchlist/types";

const CATEGORY_TYPES: AssetType[] = [
  "us_stock",
  "cn_stock",
  "hk_stock",
  "etf",
  "index",
  "forex",
  "crypto",
  "commodity",
];

interface AssetMetaRowProps {
  asset: WatchlistItemView;
  quote?: MarketQuote;
}

export function AssetMetaRow({ asset, quote }: AssetMetaRowProps) {
  const t = useTranslations("tradingChart.header");

  const categoryKey = `assetCategory.${asset.assetType}` as
    | "assetCategory.us_stock"
    | "assetCategory.cn_stock"
    | "assetCategory.hk_stock"
    | "assetCategory.etf"
    | "assetCategory.index"
    | "assetCategory.forex"
    | "assetCategory.crypto"
    | "assetCategory.commodity";

  const categoryLabel = (CATEGORY_TYPES as string[]).includes(asset.assetType)
    ? t(categoryKey)
    : asset.assetType.replace(/_/g, " ");

  const exchange = resolveExchangeCode(asset, quote);
  const displayName = quote?.name ?? asset.name;

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-mono text-lg font-bold tracking-tight text-[var(--foreground)]">
          {asset.shortLabel}
        </span>
        <span className="rounded border border-[var(--border)]/80 bg-[var(--background)] px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
          {exchange}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
          {categoryLabel}
        </span>
      </div>
      <p className="mt-0.5 max-w-[min(100%,320px)] truncate text-[11px] leading-snug text-[var(--muted)]">
        <span className="font-mono text-[10px] text-[var(--muted)]/90">
          {asset.symbol}
        </span>
        <span className="mx-1.5 text-[var(--border)]">|</span>
        {displayName}
      </p>
    </div>
  );
}
