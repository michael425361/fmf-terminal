"use client";

import { ChevronUp, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatSignedPercent, getQuoteColorClass } from "@/lib/market-data/format";
import { formatQuotePrice } from "@/lib/market-data/format";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { cn } from "@/lib/utils";

/** TradingView-style peek bar above fixed bottom nav — opens watchlist sheet */
export function WatchlistPeekBar() {
  const t = useTranslations("personalWatchlist");
  const { watchlistOpen, openWatchlist } = useMobileLayout();
  const { activeItem, items } = useWatchlist();
  const { getQuote } = useMarketData();

  if (watchlistOpen) return null;

  const quote = activeItem ? getQuote(activeItem.id) : undefined;

  return (
    <button
      type="button"
      onClick={openWatchlist}
      className="watchlist-peek-bar fixed bottom-14 left-0 right-0 z-40 flex items-center gap-3 border-t border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2.5 backdrop-blur-md transition hover:bg-[var(--surface-elevated)] lg:hidden"
      aria-label={t("openSheet")}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface-card)] text-[var(--accent)]">
        <List className="h-4 w-4" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1 text-left">
        {activeItem ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--accent)]">
                {activeItem.shortLabel}
              </span>
              <span className="truncate text-[10px] text-[var(--muted)]">
                {activeItem.name}
              </span>
            </div>
            {quote ? (
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-mono text-sm font-medium tabular-nums">
                  {formatQuotePrice(
                    quote.price,
                    quote.priceDecimals ?? 2,
                    quote.category
                  )}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    getQuoteColorClass(quote)
                  )}
                >
                  {formatSignedPercent(quote.changePercent)}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-xs text-[var(--muted)]">{t("openSheet")}</span>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-[9px] text-[var(--muted)]">
          {items.length} {t("symbolsShort")}
        </span>
        <ChevronUp className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />
      </div>
    </button>
  );
}
