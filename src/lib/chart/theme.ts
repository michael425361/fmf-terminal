import { ColorType, type ChartOptions } from "lightweight-charts";

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
  areaTop: "rgba(34, 197, 94, 0.35)",
  areaBottom: "rgba(34, 197, 94, 0.02)",
  line: "#22c55e",
};

export function getChartOptions(
  width: number,
  height: number
) {
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
    crosshair: {
      mode: 1,
      vertLine: {
        color: CHART_COLORS.crosshair,
        labelBackgroundColor: "#161b24",
      },
      horzLine: {
        color: CHART_COLORS.crosshair,
        labelBackgroundColor: "#161b24",
      },
    },
    rightPriceScale: {
      borderColor: CHART_COLORS.border,
      scaleMargins: { top: 0.08, bottom: 0.22 },
    },
    timeScale: {
      borderColor: CHART_COLORS.border,
      timeVisible: true,
      secondsVisible: false,
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
  } as ChartOptions;
}
