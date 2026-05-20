"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMarketData } from "@/providers/MarketDataProvider";
import { cn } from "@/lib/utils";

export function MarketStatusStrip() {
  const t = useTranslations("market");
  const { status, snapshot, lastError, refresh } = useMarketData();

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center justify-between border-b border-[var(--border)]/50 px-3 py-1">
        <span className="text-[10px] text-[var(--muted)]">{t("loading")}</span>
        <RefreshCw className="h-3 w-3 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  const fetchedAt = snapshot?.fetchedAt;
  const timeLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString()
    : "—";
  const hasErrors = (snapshot?.errors.length ?? 0) > 0;

  return (
    <div className="flex items-center justify-between border-b border-[var(--border)]/50 px-3 py-1">
      <span className="text-[10px] text-[var(--muted)]">
        {t("lastUpdate")}:{" "}
        <span className="font-mono text-[var(--foreground)]">{timeLabel}</span>
        {snapshot?.stale && (
          <span className="ml-2 text-[var(--accent)]">({t("stale")})</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        {hasErrors && (
          <span
            className="flex items-center gap-1 text-[10px] text-[var(--accent)]"
            title={snapshot?.errors.map((e) => e.symbol).join(", ")}
          >
            <AlertCircle className="h-3 w-3" />
            {t("partialError")}
          </span>
        )}
        {status === "error" && (
          <button
            type="button"
            onClick={() => refresh()}
            className="text-[10px] text-[var(--negative)] hover:underline"
          >
            {t("retry")}
          </button>
        )}
        {lastError && status === "error" && (
          <span className="hidden text-[10px] text-[var(--negative)] sm:inline">
            {lastError}
          </span>
        )}
        <button
          type="button"
          onClick={() => refresh()}
          className={cn(
            "rounded p-0.5 text-[var(--muted)] transition hover:text-[var(--accent)]",
            status === "success" && "hover:rotate-180"
          )}
          aria-label={t("refresh")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
