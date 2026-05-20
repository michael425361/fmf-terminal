"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { searchCatalog } from "@/lib/watchlist/catalog";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { FavoriteButton } from "./FavoriteButton";
import { cn } from "@/lib/utils";

interface SymbolSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SymbolSearchDialog({ open, onClose }: SymbolSearchDialogProps) {
  const t = useTranslations("personalWatchlist");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetCatalogEntry[]>([]);
  const { setActive } = useWatchlist();

  const runSearch = useCallback((q: string) => {
    setResults(searchCatalog(q, 16));
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    runSearch(query);
  }, [open, query, runSearch]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
          <Search className="h-4 w-4 text-[var(--muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="max-h-[360px] overflow-auto">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--muted)]">
              {query ? t("noResults") : t("searchHint")}
            </li>
          ) : (
            results.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 border-b border-[var(--border)]/40 px-3 py-2.5 transition hover:bg-[var(--surface-elevated)]"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setActive(entry.id);
                    onClose();
                  }}
                >
                  <div className="font-mono text-xs font-semibold text-[var(--accent)]">
                    {entry.shortLabel}
                  </div>
                  <div className="truncate text-[10px] text-[var(--muted)]">
                    {entry.name}
                    <span className="mx-1">·</span>
                    <span className="font-mono">{entry.symbol}</span>
                  </div>
                </button>
                <FavoriteButton assetId={entry.id} showLabel />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
