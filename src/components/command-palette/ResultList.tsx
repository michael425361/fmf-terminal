"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Pin, Star } from "lucide-react";
import type { SearchResultItem } from "@/lib/command-palette/types";
import type { MarketQuote } from "@/lib/market-data/types";
import {
  formatQuotePrice,
  formatSignedPercent,
  getQuoteColorClass,
} from "@/lib/market-data/format";
import { CategoryIcon } from "./CategoryIcon";
import { HighlightedText } from "./HighlightedText";
import { cn } from "@/lib/utils";

interface ResultListProps {
  results: SearchResultItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  isFavorite: (id: string) => boolean;
  isPinned: (id: string) => boolean;
  getQuote: (id: string) => MarketQuote | undefined;
  sectionLabel?: string;
  indexOffset?: number;
}

function ResultRow({
  item,
  globalIndex,
  selected,
  quote,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  favorited,
  pinned,
  t,
}: {
  item: SearchResultItem;
  globalIndex: number;
  selected: boolean;
  quote?: MarketQuote;
  onSelect: (index: number) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  favorited: boolean;
  pinned: boolean;
  t: ReturnType<typeof useTranslations<"commandPalette">>;
}) {
  const { entry, displayName, exchange, highlights } = item;
  const cat = entry.category === "etf" ? "us" : entry.category;

  return (
    <li>
      <div
        role="option"
        aria-selected={selected}
        id={`command-result-${globalIndex}`}
        onMouseEnter={() => onSelect(globalIndex)}
        onClick={() => onSelect(globalIndex)}
        className={cn(
          "command-result-row group flex cursor-pointer items-center gap-2 px-3 py-2.5 transition-all duration-150",
          selected && "command-result-selected"
        )}
      >
        <CategoryIcon assetType={entry.assetType} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <HighlightedText
              text={entry.shortLabel}
              highlights={highlights}
              className="font-mono text-xs font-bold text-[var(--accent)]"
            />
            <span className="rounded bg-[var(--background)] px-1 py-px text-[8px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {t(`category.${entry.assetType}`)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">
            <HighlightedText text={displayName} highlights={highlights} />
            <span className="mx-1">·</span>
            <span className="font-mono">{exchange}</span>
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          {quote ? (
            <>
              <div className="font-mono text-xs tabular-nums text-[var(--foreground)]">
                {formatQuotePrice(
                  quote.price,
                  quote.priceDecimals ?? 2,
                  cat
                )}
              </div>
              <div
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  getQuoteColorClass(quote)
                )}
              >
                {formatSignedPercent(quote.changePercent)}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-[var(--muted)]">—</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 [.command-result-selected_&]:opacity-100">
          <button
            type="button"
            title={
              favorited ? t("actions.removeWatchlist") : t("actions.addWatchlist")
            }
            onClick={(e) => onToggleFavorite(entry.id, e)}
            className={cn(
              "rounded p-1.5 transition hover:bg-[var(--surface-elevated)]",
              favorited
                ? "text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--accent)]"
            )}
          >
            <Star
              className={cn("h-3.5 w-3.5", favorited && "fill-[var(--accent)]")}
            />
          </button>
          {favorited && (
            <button
              type="button"
              title={pinned ? t("actions.unpin") : t("actions.pin")}
              onClick={(e) => onTogglePin(entry.id, e)}
              className={cn(
                "rounded p-1.5 transition hover:bg-[var(--surface-elevated)]",
                pinned
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--accent)]"
              )}
            >
              <Pin className={cn("h-3.5 w-3.5", pinned && "fill-[var(--accent)]")} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function ResultListInner({
  results,
  selectedIndex,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  isFavorite,
  isPinned,
  getQuote,
  sectionLabel,
  indexOffset = 0,
}: ResultListProps) {
  const t = useTranslations("commandPalette");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = document.getElementById(`command-result-${selectedIndex}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (results.length === 0) return null;

  return (
    <div>
      {sectionLabel && (
        <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          {sectionLabel}
        </div>
      )}
      <ul ref={listRef} role="presentation" className="pb-1">
        {results.map((item, i) => {
          const globalIndex = indexOffset + i;
          return (
            <ResultRow
              key={item.entry.id}
              item={item}
              globalIndex={globalIndex}
              selected={selectedIndex === globalIndex}
              quote={getQuote(item.entry.id)}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              favorited={isFavorite(item.entry.id)}
              pinned={isPinned(item.entry.id)}
              t={t}
            />
          );
        })}
      </ul>
    </div>
  );
}

export const ResultList = memo(ResultListInner);
