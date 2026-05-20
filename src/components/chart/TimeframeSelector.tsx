"use client";

import { useTranslations } from "next-intl";
import { TIMEFRAME_ORDER } from "@/lib/chart/timeframes";
import type { ChartTimeframe } from "@/lib/chart/types";
import { cn } from "@/lib/utils";

interface TimeframeSelectorProps {
  value: ChartTimeframe;
  onChange: (tf: ChartTimeframe) => void;
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  const t = useTranslations("tradingChart");

  return (
    <div className="flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] p-0.5">
      {TIMEFRAME_ORDER.map((tf) => (
        <button
          key={tf}
          type="button"
          onClick={() => onChange(tf)}
          className={cn(
            "rounded px-2 py-1 font-mono text-[10px] font-semibold transition",
            value === tf
              ? "bg-[var(--accent-dim)]/40 text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {t(`timeframe.${tf}`)}
        </button>
      ))}
    </div>
  );
}
