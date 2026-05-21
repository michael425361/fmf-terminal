"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { RightPanel } from "./RightPanel";
import { cn } from "@/lib/utils";

export function WatchlistBottomSheet() {
  const t = useTranslations("personalWatchlist");
  const { watchlistOpen, closeWatchlist } = useMobileLayout();

  useEffect(() => {
    if (!watchlistOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [watchlistOpen]);

  useEffect(() => {
    if (!watchlistOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWatchlist();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [watchlistOpen, closeWatchlist]);

  return (
    <div
      className={cn("lg:hidden", watchlistOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!watchlistOpen}
    >
      <button
        type="button"
        aria-label={t("closeSheet")}
        className={cn(
          "watchlist-sheet-backdrop fixed inset-0 z-[55] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300",
          watchlistOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={closeWatchlist}
        tabIndex={watchlistOpen ? 0 : -1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className={cn(
          "watchlist-sheet-panel fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(78vh,720px)] flex-col rounded-t-lg border border-b-0 border-[var(--border)] bg-[var(--surface-card)] shadow-[0_-12px_40px_rgba(0,0,0,0.45)]",
          watchlistOpen && "watchlist-sheet-open"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2 pb-1">
          <div
            className="h-1 w-10 rounded-full bg-[var(--border-subtle)]"
            aria-hidden
          />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            {t("title")}
          </span>
          <button
            type="button"
            onClick={closeWatchlist}
            className="rounded p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
            aria-label={t("closeSheet")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <RightPanel variant="sheet" onSymbolSelect={closeWatchlist} />
        </div>
      </div>
    </div>
  );
}
