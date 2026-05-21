"use client";

import { useTranslations } from "next-intl";
import type { CrosshairData } from "@/lib/chart/types";
import { formatVolume } from "@/lib/market-data/format";
import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  data: CrosshairData | null;
  timezone?: string;
}

function formatCrosshairTime(
  unixSec: number,
  timezone: string | undefined,
  intraday: boolean
): string {
  const d = new Date(unixSec * 1000);
  const tz = timezone ?? "UTC";
  if (intraday) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }).format(d);
}

export function ChartTooltip({ data, timezone }: ChartTooltipProps) {
  const t = useTranslations("tradingChart");

  if (!data) return null;

  const up = data.close >= data.open;
  const wallTime = data.realTime ?? data.time;
  const timeLabel = formatCrosshairTime(wallTime, timezone, true);

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 min-w-[140px] rounded border border-[var(--border)] bg-[var(--surface-elevated)]/95 px-2.5 py-2 font-mono text-[10px] shadow-lg backdrop-blur-sm">
      <div className="mb-1.5 text-[var(--muted)]">{timeLabel}</div>
      <div className="grid grid-cols-4 gap-x-2 gap-y-0.5">
        <span className="text-[var(--muted)]">{t("ohlc.o")}</span>
        <span className="text-right tabular-nums">{data.open.toFixed(2)}</span>
        <span className="text-[var(--muted)]">{t("ohlc.h")}</span>
        <span className="text-right tabular-nums">{data.high.toFixed(2)}</span>
        <span className="text-[var(--muted)]">{t("ohlc.l")}</span>
        <span className="text-right tabular-nums">{data.low.toFixed(2)}</span>
        <span className="text-[var(--muted)]">{t("ohlc.c")}</span>
        <span
          className={cn(
            "text-right tabular-nums",
            up ? "text-[var(--positive)]" : "text-[var(--negative)]"
          )}
        >
          {data.close.toFixed(2)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-[var(--border)] pt-1.5">
        <span className="text-[var(--muted)]">{t("ohlc.v")}</span>
        <span className="tabular-nums text-[var(--foreground)]">
          {formatVolume(data.volume)}
        </span>
      </div>
    </div>
  );
}
