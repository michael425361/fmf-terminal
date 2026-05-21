"use client";

import { BarChart2, LineChart, CandlestickChart, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChartType, ChartIndicatorState } from "@/lib/chart/types";
import { ChartFullscreenButton } from "./ChartFullscreenButton";
import { TimeframeSelector } from "./TimeframeSelector";
import type { ChartTimeframe } from "@/lib/chart/types";
import { cn } from "@/lib/utils";

interface ChartToolbarProps {
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  timeframe: ChartTimeframe;
  onTimeframeChange: (tf: ChartTimeframe) => void;
  indicators: ChartIndicatorState;
  onIndicatorsChange: (next: ChartIndicatorState) => void;
}

export function ChartToolbar({
  chartType,
  onChartTypeChange,
  timeframe,
  onTimeframeChange,
  indicators,
  onIndicatorsChange,
}: ChartToolbarProps) {
  const t = useTranslations("tradingChart");

  const toggle = (key: keyof ChartIndicatorState) => {
    onIndicatorsChange({ ...indicators, [key]: !indicators[key] });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]/60 bg-[var(--surface-card)] px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
        <ChartFullscreenButton />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <TypeButton
          active={chartType === "candlestick"}
          onClick={() => onChartTypeChange("candlestick")}
          icon={CandlestickChart}
          label={t("type.candle")}
        />
        <TypeButton
          active={chartType === "area"}
          onClick={() => onChartTypeChange("area")}
          icon={BarChart2}
          label={t("type.area")}
        />
        <TypeButton
          active={chartType === "line"}
          onClick={() => onChartTypeChange("line")}
          icon={LineChart}
          label={t("type.line")}
        />

        <span className="mx-1 h-4 w-px bg-[var(--border)]" />

        <IndButton
          active={indicators.volume}
          onClick={() => toggle("volume")}
          icon={Volume2}
          label={t("ind.volume")}
        />
        <IndButton
          active={indicators.ma20}
          onClick={() => toggle("ma20")}
          label="MA20"
        />
        <IndButton
          active={indicators.ma50}
          onClick={() => toggle("ma50")}
          label="MA50"
        />
        <IndButton
          active={indicators.vwap}
          onClick={() => toggle("vwap")}
          label="VWAP"
        />
        <IndButton
          active={indicators.rsi}
          onClick={() => toggle("rsi")}
          label={t("ind.rsi")}
        />
      </div>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof LineChart;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition",
        active
          ? "bg-[var(--accent-dim)]/35 text-[var(--accent)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IndButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof Volume2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] transition",
        active
          ? "bg-[var(--surface-elevated)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30"
          : "text-[var(--muted)] hover:text-[var(--foreground)]"
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}
