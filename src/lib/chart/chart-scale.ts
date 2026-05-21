import type { ChartTimeframe } from "./types";
import { isIntradayTimeframe } from "./timeframes";

export interface TimeScaleLayout {
  barSpacing: number;
  minBarSpacing: number;
  maxBarSpacing: number;
  rightOffset: number;
}

/**
 * Bar spacing tuned per timeframe so 5D intraday does not render oversized candles.
 */
export function getTimeScaleLayout(
  timeframe: ChartTimeframe,
  barCount: number,
  chartWidth: number
): TimeScaleLayout {
  const width = Math.max(chartWidth, 320);
  const count = Math.max(barCount, 1);
  const ideal = (width * 0.88) / count;

  if (timeframe === "1D") {
    return {
      barSpacing: clamp(ideal, 3, 9),
      minBarSpacing: 2,
      maxBarSpacing: 10,
      rightOffset: 10,
    };
  }

  if (timeframe === "5D") {
    return {
      barSpacing: clamp(ideal, 5, 9),
      minBarSpacing: 4,
      maxBarSpacing: 10,
      rightOffset: 8,
    };
  }

  if (isIntradayTimeframe(timeframe)) {
    return {
      barSpacing: clamp(ideal, 4, 10),
      minBarSpacing: 3,
      maxBarSpacing: 12,
      rightOffset: 10,
    };
  }

  return {
    barSpacing: clamp(ideal, 6, 18),
    minBarSpacing: 4,
    maxBarSpacing: 28,
    rightOffset: 6,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createChartTimeFormatter(
  timezone: string | undefined,
  timeframe: ChartTimeframe
): (time: number) => string {
  const intraday = isIntradayTimeframe(timeframe);
  const tz = timezone ?? "UTC";

  if (intraday) {
    return (time: number) => {
      const d = new Date(time * 1000);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    };
  }

  if (timeframe === "1Y") {
    return (time: number) => {
      const d = new Date(time * 1000);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        month: "short",
        year: "2-digit",
      }).format(d);
    };
  }

  return (time: number) => {
    const d = new Date(time * 1000);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };
}
