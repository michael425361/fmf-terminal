"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { resolveMarketSession } from "@/lib/chart/market-session";
import { cn } from "@/lib/utils";

interface MarketStatusBadgeProps {
  marketState?: string;
  updatedAt?: number;
  locale: string;
}

function formatUpdatedAt(ts: number | undefined, locale: string): string {
  if (ts == null) return "—";
  return new Date(ts).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function MarketStatusBadge({
  marketState,
  updatedAt,
  locale,
}: MarketStatusBadgeProps) {
  const t = useTranslations("tradingChart.header");
  const session = useMemo(
    () => resolveMarketSession(marketState),
    [marketState]
  );

  const statusLabel = t(`status.${session.kind}`);
  const compactKey =
    session.compact === "LIVE"
      ? "session.live"
      : session.compact === "PRE"
        ? "session.pre"
        : session.compact === "AH"
          ? "session.ah"
          : "session.closed";
  const compactLabel = t(compactKey);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
      <div className="flex items-center gap-2">
        {session.isLive && (
          <span className="live-dot" aria-hidden title={t("live")} />
        )}
        <span
          className={cn(
            "font-mono text-[9px] font-bold uppercase tracking-widest",
            session.kind === "open" && "text-[var(--positive)]",
            (session.kind === "pre" || session.kind === "post") &&
              "text-[var(--accent)]",
            session.kind === "closed" && "text-[var(--muted)]"
          )}
        >
          {compactLabel}
        </span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium",
            session.kind === "open" &&
              "bg-[var(--positive)]/10 text-[var(--positive)]",
            (session.kind === "pre" || session.kind === "post") &&
              "bg-[var(--accent)]/10 text-[var(--accent)]",
            session.kind === "closed" &&
              "bg-[var(--surface)] text-[var(--muted)]"
          )}
        >
          {statusLabel}
        </span>
      </div>
      <span className="text-[9px] tabular-nums text-[var(--muted)]">
        {t("updated")} {formatUpdatedAt(updatedAt, locale)}
      </span>
    </div>
  );
}
