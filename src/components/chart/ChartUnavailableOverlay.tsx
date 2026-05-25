"use client";

import { useTranslations } from "next-intl";
import { ChartSkeleton } from "@/components/market/MarketSkeleton";

export function ChartUnavailableOverlay() {
  const t = useTranslations("tradingChart");

  return (
    <div className="relative flex h-full min-h-[280px] flex-1 flex-col">
      <ChartSkeleton />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--background)]/75 px-6 text-center backdrop-blur-[2px]">
        <p className="font-mono text-xs text-[var(--muted)]">
          {t("temporarilyUnavailable")}
        </p>
        <p className="max-w-xs text-[10px] leading-relaxed text-[var(--muted)]/80">
          {t("temporarilyUnavailableHint")}
        </p>
      </div>
    </div>
  );
}
