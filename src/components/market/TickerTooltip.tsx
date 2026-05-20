"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { MarketQuote } from "@/lib/market-data/types";
import { formatQuotePrice, formatVolume } from "@/lib/market-data/format";
import { resolveExchangeCode } from "@/lib/chart/header-metrics";
import { resolveMarketSession } from "@/lib/chart/market-session";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";

interface TickerTooltipProps {
  asset: AssetCatalogEntry;
  quote: MarketQuote;
  visible: boolean;
}

function TickerTooltipInner({ asset, quote, visible }: TickerTooltipProps) {
  const t = useTranslations("tickerBar");
  const tStatus = useTranslations("tradingChart.header.status");

  const session = resolveMarketSession(quote.marketState);
  const exchange = resolveExchangeCode(asset, quote);
  const cat = asset.category === "etf" ? "us" : asset.category;

  const high = quote.high;
  const low = quote.low;
  const rangeLabel =
    high != null && low != null && Number.isFinite(high) && Number.isFinite(low)
      ? `${formatQuotePrice(low, quote.priceDecimals ?? 2, cat)} – ${formatQuotePrice(high, quote.priceDecimals ?? 2, cat)}`
      : "—";

  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-[60] mt-1.5 w-[min(100vw-24px,220px)] -translate-x-1/2 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-2 shadow-xl transition-all duration-200",
        visible
          ? "translate-y-0 opacity-100"
          : "invisible translate-y-1 opacity-0"
      )}
    >
      <p className="truncate text-[11px] font-medium leading-tight text-[var(--foreground)]">
        {quote.name}
      </p>
      <p className="mt-0.5 font-mono text-[9px] text-[var(--muted)]">
        {quote.symbol}
        <span className="mx-1 text-[var(--border)]">·</span>
        {exchange}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-[var(--border)]/60 pt-2">
        <div>
          <dt className="text-[8px] uppercase tracking-wide text-[var(--muted)]">
            {t("range")}
          </dt>
          <dd className="font-mono text-[10px] tabular-nums text-[var(--foreground)]">
            {rangeLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wide text-[var(--muted)]">
            {t("volume")}
          </dt>
          <dd className="font-mono text-[10px] tabular-nums text-[var(--foreground)]">
            {formatVolume(quote.volume)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[8px] uppercase tracking-wide text-[var(--muted)]">
            {t("session")}
          </dt>
          <dd
            className={cn(
              "text-[10px] font-medium",
              session.kind === "open" && "text-[var(--positive)]",
              (session.kind === "pre" || session.kind === "post") &&
                "text-[var(--accent)]",
              session.kind === "closed" && "text-[var(--muted)]"
            )}
          >
            {tStatus(session.kind)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export const TickerTooltip = memo(TickerTooltipInner);
