"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useMarketSearch } from "@/hooks/useMarketSearch";
import { MarketBadge } from "@/components/market/MarketBadge";
import { getCatalogDisplayName } from "@/lib/watchlist/display";
import { registerCatalogEntry } from "@/lib/watchlist/catalog-registry";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { FavoriteButton } from "./FavoriteButton";
import { cn } from "@/lib/utils";

interface SymbolSearchBarProps {
  onSelect?: (entry: AssetCatalogEntry) => void;
  className?: string;
}

export function SymbolSearchBar({ onSelect, className }: SymbolSearchBarProps) {
  const t = useTranslations("personalWatchlist");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const { setActive } = useWatchlist();

  const { results, loading } = useMarketSearch({
    query,
    enabled: query.trim().length > 0,
    limit: 12,
  });

  const displayName = (entry: AssetCatalogEntry) =>
    getCatalogDisplayName(entry, locale);

  const selectEntry = (entry: AssetCatalogEntry) => {
    registerCatalogEntry(entry);
    setActive(entry.id, entry);
    setQuery("");
    onSelect?.(entry);
  };

  const showResults = query.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        />
      </div>

      {showResults && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[240px] overflow-auto rounded border border-[var(--border)] bg-[var(--surface-card)] shadow-lg">
          {loading ? (
            <li className="px-4 py-6 text-center text-xs text-[var(--muted)]">
              {t("searching")}
            </li>
          ) : results.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-[var(--muted)]">
              {t("noResults")}
            </li>
          ) : (
            results.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 border-b border-[var(--border)]/40 px-3 py-2.5 last:border-0"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => selectEntry(entry)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                      {entry.symbol}
                    </span>
                    <MarketBadge entry={entry} />
                  </div>
                  <div className="truncate text-[10px] text-[var(--muted)]">
                    {displayName(entry)}
                  </div>
                </button>
                <FavoriteButton
                  assetId={entry.id}
                  onToggle={() => registerCatalogEntry(entry)}
                />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
