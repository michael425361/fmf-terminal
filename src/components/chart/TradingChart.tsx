"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMobileLayout } from "@/providers/MobileLayoutProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useChartData } from "@/hooks/useChartData";
import type {
  ChartType,
  ChartTimeframe,
  ChartIndicatorState,
  CrosshairData,
} from "@/lib/chart/types";
import { ChartHeader } from "./ChartHeader";
import { ChartToolbar } from "./ChartToolbar";
import { ChartTooltip } from "./ChartTooltip";
import { ChartSkeleton } from "@/components/market/MarketSkeleton";
import { prepareChartBars } from "@/lib/chart/session-filter";
import { getMarketTimezone } from "@/lib/market-data/session-filter";
import { detectMarketFromSymbol } from "@/lib/market-data/symbol-normalize";
import { cn } from "@/lib/utils";

const ChartContainer = dynamic(
  () => import("./ChartContainer").then((m) => m.ChartContainer),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DEFAULT_INDICATORS: ChartIndicatorState = {
  ma20: true,
  ma50: false,
  vwap: false,
  volume: true,
  rsi: false,
};

export function TradingChart({ className }: { className?: string }) {
  const t = useTranslations("tradingChart");
  const { activeItem } = useWatchlist();
  const { getQuote } = useMarketData();
  const { chartFullscreen } = useMobileLayout();

  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1D");
  const [indicators, setIndicators] =
    useState<ChartIndicatorState>(DEFAULT_INDICATORS);
  const [crosshair, setCrosshair] = useState<CrosshairData | null>(null);

  const symbol = activeItem?.symbol ?? null;
  const { data, loading, error } = useChartData({ symbol, timeframe });
  const quote = activeItem ? getQuote(activeItem.id) : undefined;

  const rawBars = useMemo(() => data?.bars ?? [], [data?.bars]);

  const market = useMemo(
    () => (symbol ? detectMarketFromSymbol(symbol) : "unknown"),
    [symbol]
  );

  const { displayBars, realTimeByDisplay } = useMemo(
    () => prepareChartBars(rawBars, market, timeframe),
    [rawBars, market, timeframe]
  );

  const chartTimezone = useMemo(() => {
    if (!symbol) return undefined;
    return getMarketTimezone(market) ?? data?.debug?.timezone;
  }, [symbol, market, data?.debug?.timezone]);

  return (
    <section
      data-chart-panel
      className={cn(
        "panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-out lg:min-h-[420px]",
        chartFullscreen &&
          "chart-fullscreen-panel fixed inset-0 z-[75] m-0 min-h-0 flex-1 rounded-none border-0 shadow-none",
        className
      )}
    >
      <ChartHeader
        asset={activeItem}
        quote={quote}
        bars={rawBars}
        chartFetchedAt={data?.fetchedAt}
      />
      <ChartToolbar
        chartType={chartType}
        onChartTypeChange={setChartType}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        indicators={indicators}
        onIndicatorsChange={setIndicators}
      />

      <div
        className={cn(
          "relative min-h-[220px] flex-1 sm:min-h-[280px] lg:min-h-[300px]",
          chartFullscreen && "min-h-0"
        )}
      >
        {loading && displayBars.length === 0 ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="flex h-full min-h-[280px] items-center justify-center p-6 text-center text-xs text-[var(--negative)]">
            {t("error")}: {error}
          </div>
        ) : displayBars.length === 0 ? (
          <div className="flex h-full min-h-[280px] items-center justify-center text-xs text-[var(--muted)]">
            {t("noData")}
          </div>
        ) : (
          <>
            <ChartContainer
              bars={displayBars}
              chartType={chartType}
              timeframe={timeframe}
              timezone={chartTimezone}
              indicators={indicators}
              realTimeLookup={realTimeByDisplay}
              onCrosshair={setCrosshair}
            />
            <ChartTooltip data={crosshair} timezone={chartTimezone} />
            {loading && (
              <div className="pointer-events-none absolute inset-0 bg-[var(--background)]/20 transition-opacity" />
            )}
          </>
        )}
      </div>
    </section>
  );
}
