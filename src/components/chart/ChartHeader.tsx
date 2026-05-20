"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  formatQuotePrice,
  formatSignedChange,
  formatSignedPercent,
  getQuoteColorClass,
} from "@/lib/market-data/format";
import type { MarketQuote } from "@/lib/market-data/types";
import type { OHLCVBar } from "@/lib/chart/types";
import {
  buildAssetSpecificMetrics,
  buildCoreMetrics,
} from "@/lib/chart/header-metrics";
import { resolveMarketSession } from "@/lib/chart/market-session";
import type { WatchlistItemView } from "@/lib/watchlist/types";
import { FavoriteButton } from "@/components/watchlist/FavoriteButton";
import { cn } from "@/lib/utils";
import { AssetMetaRow } from "./AssetMetaRow";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { MetricGrid } from "./MetricGrid";

interface ChartHeaderProps {
  asset: WatchlistItemView | null;
  quote?: MarketQuote;
  bars?: OHLCVBar[];
  chartFetchedAt?: number;
}

export function ChartHeader({
  asset,
  quote,
  bars = [],
  chartFetchedAt,
}: ChartHeaderProps) {
  const t = useTranslations("tradingChart");
  const locale = useLocale();

  const session = useMemo(
    () => resolveMarketSession(quote?.marketState),
    [quote?.marketState]
  );

  const coreMetrics = useMemo(() => {
    if (!asset) return [];
    return buildCoreMetrics(asset, quote, bars);
  }, [asset, quote, bars]);

  const extraMetrics = useMemo(() => {
    if (!asset) return [];
    const sessionLabel = t(`header.status.${session.kind}`);
    return buildAssetSpecificMetrics(asset, quote, locale, sessionLabel);
  }, [asset, quote, locale, session.kind, t]);

  const allMetrics = useMemo(
    () => [...coreMetrics, ...extraMetrics],
    [coreMetrics, extraMetrics]
  );

  const updatedAt = Math.max(
    quote?.updatedAt ?? 0,
    chartFetchedAt ?? 0
  );

  if (!asset) {
    return (
      <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3">
        <span className="text-xs text-[var(--muted)]">{t("noSymbol")}</span>
      </header>
    );
  }

  const price = quote?.price;
  const chg = quote?.change ?? 0;
  const pct = quote?.changePercent ?? 0;
  const priceClass = quote
    ? getQuoteColorClass(quote)
    : chg >= 0
      ? "text-[var(--positive)]"
      : "text-[var(--negative)]";

  return (
    <header className="chart-header border-b border-[var(--border)] bg-[var(--surface-elevated)] glow-active">
      <div className="flex flex-col gap-2 px-3 py-2.5">
        {/* Row 1: meta | price | status + favorite */}
        <div className="flex flex-wrap items-start gap-3 gap-y-2">
          <AssetMetaRow asset={asset} quote={quote} />

          <div className="flex min-w-[140px] flex-1 flex-col items-center justify-center px-2 sm:min-w-[180px]">
            {price != null ? (
              <>
                <div
                  className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[var(--foreground)] sm:text-3xl"
                  style={{
                    textShadow: "0 0 28px rgba(245, 158, 11, 0.12)",
                  }}
                >
                  {formatQuotePrice(
                    price,
                    quote?.priceDecimals ?? asset.priceDecimals ?? 2,
                    asset.category === "etf" ? "us" : asset.category
                  )}
                </div>
                <div
                  className={cn(
                    "mt-0.5 flex items-baseline gap-2 font-mono text-sm tabular-nums",
                    priceClass
                  )}
                >
                  <span>
                    {formatSignedChange(chg, quote?.priceDecimals ?? 2)}
                  </span>
                  <span>{formatSignedPercent(pct)}</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-[var(--muted)]">—</span>
            )}
          </div>

          <div className="ml-auto flex items-start gap-2">
            <MarketStatusBadge
              marketState={quote?.marketState}
              updatedAt={updatedAt || undefined}
              locale={locale}
            />
            <FavoriteButton assetId={asset.id} />
          </div>
        </div>

        {/* Row 2: metrics */}
        <MetricGrid metrics={allMetrics} />
      </div>
    </header>
  );
}
