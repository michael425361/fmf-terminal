"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import type {
  OHLCVBar,
  ChartType,
  ChartIndicatorState,
  ChartTimeframe,
  CrosshairData,
} from "@/lib/chart/types";
import { calcMA20, calcMA50, calcVWAP } from "@/lib/chart/indicators";
import { calcRSI } from "@/lib/chart/rsi";
import { getTimeScaleLayout } from "@/lib/chart/chart-scale";
import { resolveTimeframeResolution } from "@/lib/chart/timeframe-resolution";
import {
  getVisibleLogicalRange,
  shouldFitContent,
} from "@/lib/chart/timeframe-resolution";
import { resolveRealTime } from "@/lib/chart/session-filter";
import { CHART_COLORS, getChartOptions } from "@/lib/chart/theme";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";

interface ChartContainerProps {
  bars: OHLCVBar[];
  chartType: ChartType;
  timeframe: ChartTimeframe;
  timezone?: string;
  market?: DetectedMarket;
  indicators: ChartIndicatorState;
  realTimeLookup?: Map<number, number>;
  onCrosshair: (data: CrosshairData | null) => void;
  className?: string;
}

type AnySeries = ISeriesApi<"Candlestick" | "Area" | "Line" | "Histogram">;

function safeRemoveSeries(
  chart: IChartApi | null | undefined,
  seriesRef: React.MutableRefObject<AnySeries | null>
): void {
  const series = seriesRef.current;
  seriesRef.current = null;

  if (!chart || !series) return;

  try {
    chart.removeSeries(series);
  } catch {
    // Series may already be removed or chart is tearing down.
  }
}

interface SeriesRefs {
  main: React.MutableRefObject<AnySeries | null>;
  volume: React.MutableRefObject<AnySeries | null>;
  ma20: React.MutableRefObject<AnySeries | null>;
  ma50: React.MutableRefObject<AnySeries | null>;
  vwap: React.MutableRefObject<AnySeries | null>;
  rsi: React.MutableRefObject<AnySeries | null>;
}

function applyPaneMargins(
  chart: IChartApi,
  indicators: ChartIndicatorState
): void {
  const hasVol = indicators.volume;
  const hasRsi = indicators.rsi;

  if (hasRsi && hasVol) {
    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.48 },
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.54, bottom: 0.28 },
    });
    chart.priceScale("rsi").applyOptions({
      scaleMargins: { top: 0.74, bottom: 0.04 },
    });
  } else if (hasRsi) {
    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.32 },
    });
    chart.priceScale("rsi").applyOptions({
      scaleMargins: { top: 0.7, bottom: 0.04 },
    });
  } else if (hasVol) {
    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.06, bottom: 0.26 },
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
  } else {
    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.06, bottom: 0.08 },
    });
  }
}

function clearAllSeries(
  chart: IChartApi | null | undefined,
  refs: SeriesRefs
): void {
  safeRemoveSeries(chart, refs.main);
  safeRemoveSeries(chart, refs.volume);
  safeRemoveSeries(chart, refs.ma20);
  safeRemoveSeries(chart, refs.ma50);
  safeRemoveSeries(chart, refs.vwap);
  safeRemoveSeries(chart, refs.rsi);
}

export function ChartContainer({
  bars,
  chartType,
  timeframe,
  timezone,
  market = "unknown",
  indicators,
  realTimeLookup,
  onCrosshair,
  className,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<AnySeries | null>(null);
  const volumeSeriesRef = useRef<AnySeries | null>(null);
  const ma20Ref = useRef<AnySeries | null>(null);
  const ma50Ref = useRef<AnySeries | null>(null);
  const vwapRef = useRef<AnySeries | null>(null);
  const rsiRef = useRef<AnySeries | null>(null);
  const barsRef = useRef<OHLCVBar[]>([]);
  const realTimeLookupRef = useRef<Map<number, number>>(new Map());

  const mountedRef = useRef(false);
  const updateTokenRef = useRef(0);
  const onCrosshairRef = useRef(onCrosshair);
  onCrosshairRef.current = onCrosshair;
  const timeframeRef = useRef(timeframe);
  const timezoneRef = useRef(timezone);
  const marketRef = useRef(market);
  timeframeRef.current = timeframe;
  timezoneRef.current = timezone;
  marketRef.current = market;

  realTimeLookupRef.current = realTimeLookup ?? new Map();

  const seriesRefs: SeriesRefs = {
    main: mainSeriesRef,
    volume: volumeSeriesRef,
    ma20: ma20Ref,
    ma50: ma50Ref,
    vwap: vwapRef,
    rsi: rsiRef,
  };

  const isChartAlive = useCallback((chart?: IChartApi | null) => {
    return (
      mountedRef.current &&
      chart != null &&
      chartRef.current === chart
    );
  }, []);

  const applyMainSeries = useCallback(
    (chart: IChartApi, data: OHLCVBar[], type: ChartType, token: number) => {
      if (!isChartAlive(chart) || token !== updateTokenRef.current) return;

      const clean = data;
      if (clean.length === 0) {
        clearAllSeries(chart, seriesRefs);
        barsRef.current = [];
        return;
      }

      clearAllSeries(chart, seriesRefs);
      if (!isChartAlive(chart) || token !== updateTokenRef.current) return;

      barsRef.current = clean;

      const candleData: CandlestickData<UTCTimestamp>[] = clean.map((b) => ({
        time: b.time as UTCTimestamp,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));

      const lineData: LineData<UTCTimestamp>[] = clean.map((b) => ({
        time: b.time as UTCTimestamp,
        value: b.close,
      }));

      try {
        if (type === "candlestick") {
          const series = chart.addSeries(CandlestickSeries, {
            upColor: CHART_COLORS.up,
            downColor: CHART_COLORS.down,
            borderUpColor: CHART_COLORS.up,
            borderDownColor: CHART_COLORS.down,
            wickUpColor: CHART_COLORS.up,
            wickDownColor: CHART_COLORS.down,
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: series });
            return;
          }
          series.setData(candleData);
          mainSeriesRef.current = series;
        } else if (type === "area") {
          const series = chart.addSeries(AreaSeries, {
            lineColor: CHART_COLORS.line,
            topColor: CHART_COLORS.areaTop,
            bottomColor: CHART_COLORS.areaBottom,
            lineWidth: 2,
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: series });
            return;
          }
          series.setData(lineData);
          mainSeriesRef.current = series;
        } else {
          const series = chart.addSeries(LineSeries, {
            color: CHART_COLORS.line,
            lineWidth: 2,
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: series });
            return;
          }
          series.setData(lineData);
          mainSeriesRef.current = series;
        }

        if (!isChartAlive(chart) || token !== updateTokenRef.current) return;

        if (indicators.volume) {
          const volData: HistogramData<UTCTimestamp>[] = clean.map((b, i) => {
            const prev = i > 0 ? clean[i - 1] : b;
            const up = b.close >= prev.close;
            return {
              time: b.time as UTCTimestamp,
              value: b.volume,
              color: up
                ? "rgba(34, 197, 94, 0.55)"
                : "rgba(239, 68, 68, 0.55)",
            };
          });
          const vol = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: vol });
            return;
          }
          vol.setData(volData);
          volumeSeriesRef.current = vol;
        }

        applyPaneMargins(chart, indicators);

        if (indicators.ma20 && clean.length >= 20) {
          const ma = chart.addSeries(LineSeries, {
            color: CHART_COLORS.ma20,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: ma });
            return;
          }
          ma.setData(
            calcMA20(clean).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          );
          ma20Ref.current = ma;
        }

        if (indicators.ma50 && clean.length >= 50) {
          const ma = chart.addSeries(LineSeries, {
            color: CHART_COLORS.ma50,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: ma });
            return;
          }
          ma.setData(
            calcMA50(clean).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          );
          ma50Ref.current = ma;
        }

        if (indicators.vwap) {
          const vwap = chart.addSeries(LineSeries, {
            color: CHART_COLORS.vwap,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: vwap });
            return;
          }
          vwap.setData(
            calcVWAP(clean).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          );
          vwapRef.current = vwap;
        }

        if (indicators.rsi && clean.length >= 15) {
          const rsi = chart.addSeries(LineSeries, {
            color: CHART_COLORS.rsi,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            priceScaleId: "rsi",
          });
          if (!isChartAlive(chart) || token !== updateTokenRef.current) {
            safeRemoveSeries(chart, { current: rsi });
            return;
          }
          rsi.setData(
            calcRSI(clean).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          );
          chart.priceScale("rsi").applyOptions({
            autoScale: true,
            scaleMargins: { top: 0.74, bottom: 0.04 },
          });
          rsiRef.current = rsi;
          applyPaneMargins(chart, indicators);
        }

        if (isChartAlive(chart) && token === updateTokenRef.current) {
          const width = containerRef.current?.clientWidth ?? 800;
          const layout = getTimeScaleLayout(
            timeframeRef.current,
            clean.length,
            width,
            marketRef.current
          );
          chart.timeScale().applyOptions(layout);

          const resolution = resolveTimeframeResolution(
            timeframeRef.current,
            marketRef.current
          );

          if (shouldFitContent(resolution)) {
            chart.timeScale().fitContent();
          } else {
            const range = getVisibleLogicalRange(resolution, clean.length);
            if (range) {
              chart.timeScale().setVisibleLogicalRange(range);
            } else {
              chart.timeScale().fitContent();
            }
          }
        }
      } catch {
        if (isChartAlive(chart)) {
          clearAllSeries(chart, seriesRefs);
        }
      }
    },
    [indicators, isChartAlive]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    mountedRef.current = true;
    updateTokenRef.current += 1;

    const chart = createChart(
      el,
      getChartOptions(el.clientWidth, el.clientHeight, {
        timezone: timezoneRef.current,
        timeframe: timeframeRef.current,
        market: marketRef.current,
      })
    );
    chartRef.current = chart;

    const crosshairHandler = (param: MouseEventParams<Time>) => {
      if (!mountedRef.current) return;
      if (!param.time || !param.point) {
        onCrosshairRef.current(null);
        return;
      }
      const t =
        typeof param.time === "number" ? param.time : undefined;
      if (t === undefined) {
        onCrosshairRef.current(null);
        return;
      }
      const bar = barsRef.current.find((b) => b.time === t);
      if (bar) {
        const realTime = resolveRealTime(
          bar.time,
          realTimeLookupRef.current
        );
        onCrosshairRef.current({
          time: bar.time,
          realTime,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        });
      }
    };

    chart.subscribeCrosshairMove(crosshairHandler);

    const ro = new ResizeObserver((entries) => {
      if (!mountedRef.current || chartRef.current !== chart) return;
      const { width, height } = entries[0]?.contentRect ?? { width: 0, height: 0 };
      if (width > 0 && height > 0) {
        try {
          chart.applyOptions({ width, height });
        } catch {
          // Chart may be disposed during resize.
        }
      }
    });
    ro.observe(el);

    return () => {
      mountedRef.current = false;
      updateTokenRef.current += 1;
      ro.disconnect();

      clearAllSeries(chart, seriesRefs);

      try {
        chart.unsubscribeCrosshairMove(crosshairHandler);
      } catch {
        // ignore
      }

      try {
        chart.remove();
      } catch {
        // ignore
      }

      chartRef.current = null;
      barsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mountedRef.current) return;

    const token = ++updateTokenRef.current;

    if (bars.length === 0) {
      clearAllSeries(chart, seriesRefs);
      barsRef.current = [];
      return;
    }

    applyMainSeries(chart, bars, chartType, token);

    return () => {
      updateTokenRef.current += 1;
    };
  }, [bars, chartType, indicators, timeframe, applyMainSeries]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mountedRef.current) return;
    chart.applyOptions(
      getChartOptions(
        containerRef.current?.clientWidth ?? 800,
        containerRef.current?.clientHeight ?? 400,
        { timezone, timeframe, market }
      )
    );
  }, [timeframe, timezone, market]);

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "h-full w-full min-h-[280px] max-w-full overflow-hidden touch-manipulation"
      }
    />
  );
}
