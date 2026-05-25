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
import { ChartUnavailableOverlay } from "./ChartUnavailableOverlay";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { prepareChartBars } from "@/lib/chart/session-filter";
import { getChartTimezone } from "@/lib/chart/market-config";
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
  const { data, loading, unavailable } = useChartData({ symbol, timeframe });
  const quote = activeItem ? getQuote(activeItem.id) : undefined;

  const rawBars = useMemo(() => data?.bars ?? [], [data?.bars]);

  const market = useMemo(
    () => (symbol ? detectMarketFromSymbol(symbol) : "unknown"),
    [symbol]
  );

  const { bars: displayBars, realTimeByDisplay } = useMemo(
    () => prepareChartBars(rawBars, market, timeframe),
    [rawBars, market, timeframe]
  );

  const chartTimezone = useMemo(
    () => getChartTimezone(market, data?.debug?.timezone),
    [market, data?.debug?.timezone]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-2",
        chartFullscreen && "h-full min-h-0",
        className
      )}
    >
    <section
      data-chart-panel
      className={cn(
        "panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-out lg:min-h-[420px]",
        chartFullscreen &&
          "chart-fullscreen-panel fixed inset-0 z-[75] m-0 min-h-0 flex-1 rounded-none border-0 shadow-none",
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
        {unavailable && displayBars.length === 0 ? (
          <ChartUnavailableOverlay />
        ) : loading && displayBars.length === 0 ? (
          <ChartSkeleton />
        ) : displayBars.length === 0 ? (
          <ChartUnavailableOverlay />
        ) : (
          <>
            <ChartContainer
              bars={displayBars}
              chartType={chartType}
              timeframe={timeframe}
              timezone={chartTimezone}
              market={market}
              indicators={indicators}
              realTimeLookup={realTimeByDisplay}
              onCrosshair={setCrosshair}
            />
            <ChartTooltip
              data={crosshair}
              timezone={chartTimezone}
              timeframe={timeframe}
              market={market}
            />
            {loading && (
              <div className="pointer-events-none absolute inset-0 bg-[var(--background)]/20 transition-opacity" />
            )}
          </>
        )}
      </div>
    </section>

      {!chartFullscreen && (
        <AISummaryCard
          asset={activeItem ?? null}
          market={market}
          quote={quote}
          candles={rawBars}
        />
      )}
    </div>
  );
}
