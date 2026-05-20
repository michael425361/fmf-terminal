"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useCommandPalette } from "@/providers/CommandPaletteProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  commandSearchQuery,
  parseCommand,
} from "@/lib/command-palette/command-parser";
import {
  getEntriesByIds,
  searchAssets,
} from "@/lib/command-palette/search-engine";
import {
  getRecentIds,
  loadRecentStore,
  recordSearchedAsset,
  recordViewedAsset,
} from "@/lib/command-palette/recent-store";
import { resolveExchangeCode } from "@/lib/chart/header-metrics";
import { CATALOG_BY_ID, resolveCatalogEntry } from "@/lib/watchlist/catalog";
import { MARKET_SYMBOLS } from "@/lib/market-data/symbols";
import type { SearchResultItem } from "@/lib/command-palette/types";
import { SearchInput } from "./SearchInput";
import { ResultList } from "./ResultList";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const tAssets = useTranslations("market.assets");
  const { open, closePalette } = useCommandPalette();
  const {
    setActive,
    toggle,
    togglePin,
    isFavorite,
    items,
  } = useWatchlist();
  const { getQuote } = useMarketData();

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recents, setRecents] = useState(loadRecentStore);

  const debouncedQuery = useDebouncedValue(query, 80);
  const parsed = useMemo(() => parseCommand(debouncedQuery), [debouncedQuery]);
  const searchQ = commandSearchQuery(parsed);
  const isCommandMode = parsed.type !== "search" || /^[a-z]+\s/i.test(query.trim());

  const localizedNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of MARKET_SYMBOLS) {
      try {
        map[m.id] = tAssets(`${m.id}.name`);
      } catch {
        // skip missing keys
      }
    }
    for (const item of items) {
      if (!map[item.id]) map[item.id] = item.name;
    }
    return map;
  }, [tAssets, items]);

  const favoriteIds = useMemo(
    () => new Set(items.map((i) => i.id)),
    [items]
  );

  const recentIds = useMemo(() => getRecentIds(recents), [recents]);

  const searchResults = useMemo((): SearchResultItem[] => {
    if (!searchQ.trim()) {
      const favResults = getEntriesByIds(
        items.map((i) => i.id).slice(0, 8)
      ).map((entry) => ({
        entry,
        score: 100,
        displayName: localizedNames[entry.id] ?? entry.name,
        exchange: resolveExchangeCode(entry),
        highlights: [] as Array<[number, number]>,
      }));
      const recentEntries = getEntriesByIds(recentIds.slice(0, 8));
      const seen = new Set(favResults.map((r) => r.entry.id));
      const recentResults = recentEntries
        .filter((e) => !seen.has(e.id))
        .map((entry) => ({
          entry,
          score: 50,
          displayName: localizedNames[entry.id] ?? entry.name,
          exchange: resolveExchangeCode(entry),
          highlights: [] as Array<[number, number]>,
        }));
      return [...favResults, ...recentResults].slice(0, 16);
    }

    return searchAssets({
      query: searchQ,
      limit: 24,
      localizedNames,
      favoriteIds,
      recentIds,
    });
  }, [searchQ, localizedNames, favoriteIds, recentIds, items]);

  const flatResults = searchResults;

  useEffect(() => {
    if (open) {
      setRecents(loadRecentStore());
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  const resolveAndActivate = useCallback(
    (ref: string) => {
      const entry =
        resolveCatalogEntry(ref) ??
        CATALOG_BY_ID[ref] ??
        searchAssets({
          query: ref,
          limit: 1,
          localizedNames,
          favoriteIds,
        })[0]?.entry;

      if (!entry) return false;

      if (parsed.type === "watchlist-add") {
        if (!isFavorite(entry.id)) toggle(entry.id);
      } else if (parsed.type === "watchlist-remove") {
        if (isFavorite(entry.id)) toggle(entry.id);
      } else {
        setActive(entry.id);
      }

      recordViewedAsset(entry.id);
      recordSearchedAsset(entry.id);
      setRecents(loadRecentStore());
      closePalette();
      return true;
    },
    [
      parsed.type,
      localizedNames,
      favoriteIds,
      isFavorite,
      toggle,
      setActive,
      closePalette,
    ]
  );

  const activateResult = useCallback(
    (index: number) => {
      const item = flatResults[index];
      if (!item) return;

      if (parsed.type === "watchlist-add") {
        if (!isFavorite(item.entry.id)) toggle(item.entry.id);
      } else if (parsed.type === "watchlist-remove") {
        if (isFavorite(item.entry.id)) toggle(item.entry.id);
      } else {
        setActive(item.entry.id);
      }

      recordViewedAsset(item.entry.id);
      recordSearchedAsset(item.entry.id);
      setRecents(loadRecentStore());
      closePalette();
    },
    [flatResults, parsed.type, isFavorite, toggle, setActive, closePalette]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const count = flatResults.length;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (count ? (i + 1) % count : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (count ? (i - 1 + count) % count : 0));
        return;
      }
      if (e.key === "Tab" && count > 0) {
        e.preventDefault();
        const item = flatResults[selectedIndex] ?? flatResults[0];
        if (item) {
          setQuery(`${parsed.type === "search" ? "" : `${parsed.type} `}${item.entry.shortLabel}`);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (count > 0) {
          activateResult(selectedIndex);
        } else if (parsed.argument || query.trim()) {
          resolveAndActivate(parsed.argument || query.trim());
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
      }
    },
    [
      flatResults,
      selectedIndex,
      parsed,
      query,
      activateResult,
      resolveAndActivate,
      closePalette,
    ]
  );

  const handleToggleFavorite = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      toggle(id);
    },
    [toggle]
  );

  const handleTogglePin = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      togglePin(id);
    },
    [togglePin]
  );

  const isPinned = useCallback(
    (id: string) => items.find((i) => i.id === id)?.pinned ?? false,
    [items]
  );

  if (!open) return null;

  const showSections = !searchQ.trim();
  const favCount = items.length;
  const recentOnly = flatResults.slice(favCount);

  return (
    <div
      className="command-palette-overlay fixed inset-0 z-[200] flex items-start justify-center bg-black/55 p-3 pt-[10vh] backdrop-blur-md sm:p-6"
      onClick={closePalette}
      role="presentation"
    >
      <div
        className="command-palette-panel panel relative flex max-h-[min(72vh,560px)] w-full max-w-2xl flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
      >
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
          onKeyDown={handleInputKeyDown}
          isCommandMode={isCommandMode}
        />

        <button
          type="button"
          onClick={closePalette}
          className="absolute right-3 top-3 rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>

        <div
          id="command-palette-results"
          className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
          role="listbox"
        >
          {flatResults.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-[var(--muted)]">
              {searchQ ? t("noResults") : t("emptyHint")}
            </p>
          ) : showSections ? (
            <>
              {favCount > 0 && (
                <ResultList
                  results={flatResults.slice(0, favCount)}
                  selectedIndex={selectedIndex}
                  onSelect={setSelectedIndex}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePin={handleTogglePin}
                  isFavorite={isFavorite}
                  isPinned={isPinned}
                  getQuote={getQuote}
                  sectionLabel={t("sections.favorites")}
                  indexOffset={0}
                />
              )}
              {recentOnly.length > 0 && (
                <ResultList
                  results={recentOnly}
                  selectedIndex={selectedIndex}
                  onSelect={setSelectedIndex}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePin={handleTogglePin}
                  isFavorite={isFavorite}
                  isPinned={isPinned}
                  getQuote={getQuote}
                  sectionLabel={t("sections.recents")}
                  indexOffset={favCount}
                />
              )}
            </>
          ) : (
            <ResultList
              results={flatResults}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              isFavorite={isFavorite}
              isPinned={isPinned}
              getQuote={getQuote}
              sectionLabel={t("sections.results")}
            />
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)]/80 bg-[var(--background)]/60 px-3 py-2">
          <span className="font-mono text-[9px] text-[var(--muted)]">
            {t("footer.commands")}
          </span>
          <div className="flex gap-2 text-[9px] text-[var(--muted)]">
            <kbd className="rounded border border-[var(--border)] px-1">↑↓</kbd>
            <span>{t("footer.navigate")}</span>
            <kbd className="rounded border border-[var(--border)] px-1">↵</kbd>
            <span>{t("footer.open")}</span>
            <kbd className="rounded border border-[var(--border)] px-1">tab</kbd>
            <span>{t("footer.complete")}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
