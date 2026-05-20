"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useMarketSearch } from "@/hooks/useMarketSearch";
import { getChinaAShareDef } from "@/lib/watchlist/china-a-shares";
import { registerCatalogEntry } from "@/lib/watchlist/catalog-registry";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { FavoriteButton } from "./FavoriteButton";

interface SymbolSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SymbolSearchDialog({ open, onClose }: SymbolSearchDialogProps) {
  const t = useTranslations("personalWatchlist");
  const locale = useLocale();

  const displayName = (entry: AssetCatalogEntry) => {
    const cn = getChinaAShareDef(entry.id);
    if (cn) return locale === "zh" ? cn.nameZh : cn.nameEn;
    return entry.name;
  };
  const [query, setQuery] = useState("");
  const { setActive } = useWatchlist();

  const { results, loading } = useMarketSearch({
    query,
    enabled: open,
    limit: 16,
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selectEntry = (entry: AssetCatalogEntry) => {
    registerCatalogEntry(entry);
    setActive(entry.id, entry);
    onClose();
  };

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
          {loading && query.trim() ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--muted)]">
              {t("searching")}
            </li>
          ) : results.length === 0 ? (
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
                  onClick={() => selectEntry(entry)}
                >
                  <div className="font-mono text-xs font-semibold text-[var(--accent)]">
                    {entry.shortLabel}
                  </div>
                  <div className="truncate text-[10px] text-[var(--muted)]">
                    {displayName(entry)}
                    <span className="mx-1">·</span>
                    <span className="font-mono">{entry.symbol}</span>
                  </div>
                </button>
                <FavoriteButton
                  assetId={entry.id}
                  showLabel
                  onToggle={() => registerCatalogEntry(entry)}
                />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
