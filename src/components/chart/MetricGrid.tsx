"use client";

import { useTranslations } from "next-intl";
import type { HeaderMetricItem, HeaderMetricKey } from "@/lib/chart/header-metrics";
import { cn } from "@/lib/utils";

interface MetricGridProps {
  metrics: HeaderMetricItem[];
  className?: string;
}

const TOOLTIP_KEYS: Partial<Record<HeaderMetricKey, HeaderMetricKey>> = {
  open: "open",
  high: "high",
  low: "low",
  prevClose: "prevClose",
  volume: "volume",
  marketCap: "marketCap",
  pe: "pe",
};

export function MetricGrid({ metrics, className }: MetricGridProps) {
  const t = useTranslations("tradingChart.header");

  if (metrics.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-x-3 gap-y-1.5 sm:grid-cols-5 lg:grid-cols-10",
        className
      )}
    >
      {metrics.map((metric) => {
        const label = t(`metrics.${metric.key}`);
        const tooltipKey = TOOLTIP_KEYS[metric.key];
        const title = tooltipKey ? t(`tooltips.${tooltipKey}`) : undefined;

        return (
          <div key={metric.key} className="group min-w-0" title={title}>
            <div className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {label}
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] tabular-nums text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
              {metric.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
