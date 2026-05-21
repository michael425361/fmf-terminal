"use client";

import { GripVertical, Pin, PinOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { formatSignedPercent, getQuoteColorClass } from "@/lib/market-data/format";
import { formatQuotePrice } from "@/lib/market-data/format";
import { isQuotePositive } from "@/lib/market-data/format";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import type { WatchlistItemView } from "@/lib/watchlist/types";
import { Sparkline } from "./Sparkline";
import { WatchlistSkeleton } from "@/components/market/MarketSkeleton";
import { cn } from "@/lib/utils";

interface PersonalWatchlistProps {
  mobile?: boolean;
  onSymbolSelect?: () => void;
}

export function PersonalWatchlist({
  mobile = false,
  onSymbolSelect,
}: PersonalWatchlistProps = {}) {
  const t = useTranslations("personalWatchlist");
  const { items, activeId, setActive, remove, togglePin, reorder, hydrated } =
    useWatchlist();
  const { status, getQuote, getPreviousQuote, watchlistSparklines } =
    useMarketData();
  const loading = !hydrated || (status === "loading" && items.length === 0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <section
      className={cn(
        "panel flex flex-1 flex-col overflow-hidden",
        mobile ? "min-h-[200px] border-0" : "min-h-[320px]"
      )}
    >
      <div className="panel-header">
        <span>{t("title")}</span>
        <span className="font-mono text-[var(--accent)]">{items.length}</span>
      </div>

      {loading ? (
        <WatchlistSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-[var(--muted)]">
          {t("empty")}
        </div>
      ) : (
        <ul className="scrollbar-thin flex-1 divide-y divide-[var(--border)]/40 overflow-auto">
          {items.map((item, index) => (
            <WatchlistRow
              key={item.id}
              item={item}
              index={index}
              active={item.id === activeId}
              quote={getQuote(item.id)}
              previous={getPreviousQuote(item.id)}
              sparkline={watchlistSparklines[item.id]}
              onSelect={() => {
                setActive(item.id);
                onSymbolSelect?.();
              }}
              mobile={mobile}
              onRemove={() => remove(item.id)}
              onTogglePin={() => togglePin(item.id)}
              dragIndex={dragIndex}
              setDragIndex={setDragIndex}
              onReorder={reorder}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function WatchlistRow({
  item,
  index,
  active,
  quote,
  previous,
  sparkline,
  onSelect,
  onRemove,
  onTogglePin,
  dragIndex,
  setDragIndex,
  onReorder,
  mobile = false,
}: {
  item: WatchlistItemView;
  index: number;
  active: boolean;
  quote?: ReturnType<ReturnType<typeof useMarketData>["getQuote"]>;
  previous?: ReturnType<ReturnType<typeof useMarketData>["getPreviousQuote"]>;
  sparkline?: number[];
  onSelect: () => void;
  onRemove: () => void;
  onTogglePin: () => void;
  dragIndex: number | null;
  setDragIndex: (i: number | null) => void;
  onReorder: (from: number, to: number) => void;
  mobile?: boolean;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  const positive = quote ? isQuotePositive(quote) : true;
  const flash =
    quote && previous && quote.price !== previous.price
      ? quote.price > previous.price
        ? "quote-flash-up"
        : "quote-flash-down"
      : "";

  return (
    <li
      ref={rowRef}
      draggable={!mobile}
      onDragStart={() => setDragIndex(index)}
      onDragEnd={() => setDragIndex(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        if (dragIndex !== null && dragIndex !== index) {
          onReorder(dragIndex, index);
        }
        setDragIndex(null);
      }}
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-2 px-2 py-2.5 transition",
        "hover:bg-[var(--surface-elevated)]",
        active && "watchlist-active glow-active",
        dragIndex === index && "opacity-50",
        flash
      )}
      title={`${item.name} (${item.symbol})`}
    >
      {!mobile && (
        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-[var(--muted)] opacity-40 group-hover:opacity-100" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
            {item.shortLabel}
          </span>
          {item.pinned && (
            <Pin className="h-3 w-3 text-[var(--accent)]" fill="currentColor" />
          )}
        </div>
        <div className="truncate text-[10px] text-[var(--muted)]">{item.name}</div>
      </div>

      <Sparkline data={sparkline} positive={positive} />

      <div className="shrink-0 text-right">
        {quote ? (
          <>
            <div className="font-mono text-xs font-medium">
              {formatQuotePrice(
                quote.price,
                quote.priceDecimals ?? 2,
                quote.category
              )}
            </div>
            <div
              className={cn(
                "font-mono text-[10px]",
                getQuoteColorClass(quote)
              )}
            >
              {formatSignedPercent(quote.changePercent)}
            </div>
          </>
        ) : (
          <div className="skeleton ml-auto h-8 w-16" />
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="rounded p-0.5 text-[var(--muted)] hover:text-[var(--accent)]"
          aria-label="pin"
        >
          {item.pinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded p-0.5 text-[var(--muted)] hover:text-[var(--negative)]"
          aria-label="remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
