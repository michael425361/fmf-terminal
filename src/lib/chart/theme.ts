import { ColorType, type ChartOptions, type Time } from "lightweight-charts";
import type { ChartTimeframe } from "./types";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import {
  createChartTimeFormatter,
  timeToUnixSeconds,
} from "./chart-scale";
import { getProfessionalCrosshairOptions } from "./crosshair";

export const CHART_COLORS = {
  background: "#0f1218",
  text: "#9ca3af",
  grid: "#1e2633",
  border: "#252d3a",
  crosshair: "#6b7280",
  up: "#22c55e",
  down: "#ef4444",
  ma20: "#3b82f6",
  ma50: "#a855f7",
  vwap: "#f59e0b",
  rsi: "#e879f9",
  rsiBand: "rgba(232, 121, 249, 0.12)",
  areaTop: "rgba(34, 197, 94, 0.35)",
  areaBottom: "rgba(34, 197, 94, 0.02)",
  line: "#22c55e",
};

export function getChartOptions(
  width: number,
  height: number,
  options?: {
    timezone?: string;
    timeframe?: ChartTimeframe;
    market?: DetectedMarket;
  }
) {
  const timeframe = options?.timeframe ?? "1D";
  const market = options?.market;
  const formatTime = createChartTimeFormatter(
    options?.timezone,
    timeframe,
    market
  );

  const formatAxisTime = (time: Time) => formatTime(timeToUnixSeconds(time));

  return {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: CHART_COLORS.background },
      textColor: CHART_COLORS.text,
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: CHART_COLORS.grid },
      horzLines: { color: CHART_COLORS.grid },
    },
    crosshair: getProfessionalCrosshairOptions(),
    rightPriceScale: {
      borderColor: CHART_COLORS.border,
      scaleMargins: { top: 0.08, bottom: 0.22 },
    },
    localization: {
      locale: "en-GB",
      timeFormatter: formatAxisTime,
    },
    timeScale: {
      borderColor: CHART_COLORS.border,
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 12,
      barSpacing: 8,
      minBarSpacing: 4,
      maxBarSpacing: 14,
      fixLeftEdge: false,
      fixRightEdge: false,
      tickMarkFormatter: formatAxisTime,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  } as unknown as ChartOptions;
}
