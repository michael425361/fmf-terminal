"use client";

import { useTranslations } from "next-intl";
import type { CrosshairData } from "@/lib/chart/types";
import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  data: CrosshairData | null;
}

export function ChartTooltip({ data }: ChartTooltipProps) {
  const t = useTranslations("tradingChart");

  if (!data) return null;

  const up = data.close >= data.open;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 rounded border border-[var(--border)] bg-[var(--surface-elevated)]/95 px-2.5 py-2 font-mono text-[10px] shadow-lg backdrop-blur-sm">
      <div className="mb-1 text-[var(--muted)]">
        {new Date(data.time * 1000).toLocaleString()}
      </div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-0.5">
        <span className="text-[var(--muted)]">{t("ohlc.o")}</span>
        <span>{data.open.toFixed(2)}</span>
        <span className="text-[var(--muted)]">{t("ohlc.h")}</span>
        <span>{data.high.toFixed(2)}</span>
        <span className="text-[var(--muted)]">{t("ohlc.l")}</span>
        <span>{data.low.toFixed(2)}</span>
        <span className="text-[var(--muted)]">{t("ohlc.c")}</span>
        <span
          className={cn(
            up ? "text-[var(--positive)]" : "text-[var(--negative)]"
          )}
        >
          {data.close.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 border-t border-[var(--border)] pt-1 text-[var(--muted)]">
        {t("ohlc.v")}{" "}
        <span className="text-[var(--foreground)]">
          {data.volume.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
