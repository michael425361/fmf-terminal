import type { ChartTimeframe } from "./types";
import {
  resolveTimeframeResolution,
  type AxisTimeMode,
  type TimeframeResolution,
} from "./timeframe-resolution";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import { getChartTimezone } from "./market-config";

export interface TimeScaleLayout {
  barSpacing: number;
  minBarSpacing: number;
  maxBarSpacing: number;
  rightOffset: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getTimeScaleLayout(
  timeframe: ChartTimeframe,
  barCount: number,
  chartWidth: number,
  market?: DetectedMarket
): TimeScaleLayout {
  const resolution = resolveTimeframeResolution(
    timeframe,
    market ?? "unknown"
  );
  const width = Math.max(chartWidth, 320);
  const count = Math.max(barCount, 1);
  const ideal = (width * 0.9) / count;
  const isAsia = market === "hk" || market === "tw" || market === "cn";

  switch (resolution.category) {
    case "tick":
      return {
        barSpacing: clamp(ideal, isAsia ? 5 : 4, isAsia ? 11 : 9),
        minBarSpacing: 3,
        maxBarSpacing: isAsia ? 12 : 10,
        rightOffset: 10,
      };
    case "short":
      return {
        barSpacing: clamp(ideal, 4, 9),
        minBarSpacing: 3,
        maxBarSpacing: 10,
        rightOffset: 8,
      };
    case "swing":
      return {
        barSpacing: clamp(ideal, 5, 10),
        minBarSpacing: 4,
        maxBarSpacing: 11,
        rightOffset: 8,
      };
    case "hourly":
      return {
        barSpacing: clamp(ideal, 5, 12),
        minBarSpacing: 4,
        maxBarSpacing: 14,
        rightOffset: 6,
      };
    case "daily":
    default:
      return {
        barSpacing: clamp(ideal, 6, 16),
        minBarSpacing: 4,
        maxBarSpacing: 24,
        rightOffset: 4,
      };
  }
}

export function formatChartTimeInZone(
  unixSec: number,
  timezone: string,
  axisMode: AxisTimeMode
): string {
  const d = new Date(unixSec * 1000);

  if (axisMode === "intraday") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      hour12: false,
    }).format(d);
  }

  if (axisMode === "longTerm") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      month: "short",
    }).format(d);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function createChartTimeFormatter(
  timezone: string | undefined,
  timeframe: ChartTimeframe,
  market?: DetectedMarket
): (time: number) => string {
  const resolution = resolveTimeframeResolution(
    timeframe,
    market ?? "unknown"
  );
  const tz = getChartTimezone(market ?? "unknown", timezone ?? "UTC");

  return (time: number) =>
    formatChartTimeInZone(time, tz, resolution.axisMode);
}

export function timeToUnixSeconds(
  time: import("lightweight-charts").Time
): number {
  if (typeof time === "number") return time;
  if (typeof time === "object" && time !== null && "year" in time) {
    return Math.floor(
      Date.UTC(time.year, time.month - 1, time.day) / 1000
    );
  }
  return 0;
}

export function getChartAxisMode(
  timeframe: ChartTimeframe,
  market?: DetectedMarket
): AxisTimeMode {
  return resolveTimeframeResolution(timeframe, market ?? "unknown")
    .axisMode;
}
