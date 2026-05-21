"use client";

import { forwardRef, memo, useCallback, useState } from "react";
import type { MarketQuote, MarketSymbolDefinition } from "@/lib/market-data/types";
import {
  formatSignedPercent,
  getDirectionArrow,
  getFlashClass,
  getPriceTickClass,
  getQuoteColorClass,
} from "@/lib/market-data/format";
import { resolveMarketSession } from "@/lib/chart/market-session";
import { CATALOG_BY_ID } from "@/lib/watchlist/catalog";
import { QuoteValue } from "./QuoteValue";
import { TickerTooltip } from "./TickerTooltip";
import { FavoriteButton } from "@/components/watchlist/FavoriteButton";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { cn } from "@/lib/utils";

export interface TickerChipProps {
  definition: MarketSymbolDefinition;
  quote?: MarketQuote;
  previous?: MarketQuote;
  loading?: boolean;
  isActive: boolean;
  tabIndex: number;
  onSelect: (id: string) => void;
  onFocusRequest: (id: string) => void;
}

const TickerChipInner = forwardRef<HTMLButtonElement, TickerChipProps>(
  function TickerChipInner(
    {
      definition,
      quote,
      previous,
      loading,
      isActive,
      tabIndex,
      onSelect,
      onFocusRequest,
    },
    ref
  ) {
    const [hovered, setHovered] = useState(false);
    const { isFavorite } = useWatchlist();
    const asset = CATALOG_BY_ID[definition.id];
    const favorited = isFavorite(definition.id);

    const handleClick = useCallback(() => {
      onSelect(definition.id);
    }, [definition.id, onSelect]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(definition.id);
        }
      },
      [definition.id, onSelect]
    );

    if (loading || !quote || !asset) {
      return (
        <div
          className="flex min-w-[84px] shrink-0 flex-col justify-center gap-0.5 border-r border-[var(--border)] px-2 py-1.5 lg:min-w-[118px] lg:gap-1 lg:px-3 lg:py-2"
          aria-hidden
        >
          <div className="skeleton h-3 w-10" />
          <div className="skeleton h-4 w-16" />
        </div>
      );
    }

    const pctClass = getQuoteColorClass(quote);
    const flashClass = getFlashClass(quote, previous);
    const tickClass = getPriceTickClass(quote, previous);
    const arrow = getDirectionArrow(quote);
    const session = resolveMarketSession(quote.marketState);
    const showLivePulse = isActive && session.isLive;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={tabIndex}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={() => onFocusRequest(definition.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "ticker-chip group relative flex min-w-[76px] shrink-0 flex-col justify-center border-r border-[var(--border)] px-1.5 py-1 text-left transition-colors duration-200 lg:min-w-[108px] lg:px-2.5 lg:py-2",
          "hover:bg-[var(--surface-card)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--accent)]",
          isActive && "ticker-chip-active bg-[var(--surface-card)]",
          flashClass
        )}
      >
        {showLivePulse && (
          <span
            className="ticker-live-pulse pointer-events-none absolute inset-x-0 top-0 h-px"
            aria-hidden
          />
        )}

        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-[10px] font-semibold tracking-wide transition-colors lg:text-xs",
                isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"
              )}
            >
              {quote.shortLabel}
            </span>
            <span
              className={cn(
                "font-mono text-[8px] tabular-nums leading-none lg:text-[9px]",
                pctClass
              )}
            >
              <span className="mr-0.5 opacity-90" aria-hidden>
                {arrow}
              </span>
              {formatSignedPercent(quote.changePercent)}
            </span>
          </div>
          <FavoriteButton
            assetId={definition.id}
            className={cn(
              "shrink-0 transition-opacity",
              favorited || isActive
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            )}
          />
        </div>

        <QuoteValue
          quote={quote}
          previous={previous}
          showChange={false}
          tickClass={tickClass}
          className="[&>div:first-child]:text-xs [&>div:first-child]:font-semibold [&>div:first-child]:leading-none lg:[&>div:first-child]:text-[13px]"
        />

        <TickerTooltip asset={asset} quote={quote} visible={hovered} />
      </button>
    );
  }
);

export const TickerChip = memo(TickerChipInner);
