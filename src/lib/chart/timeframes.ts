import type { ChartTimeframe } from "./types";

export interface TimeframeConfig {
  id: ChartTimeframe;
  label: string;
  days: number;
  interval:
    | "1m"
    | "2m"
    | "5m"
    | "15m"
    | "30m"
    | "60m"
    | "90m"
    | "1h"
    | "1d"
    | "5d"
    | "1wk"
    | "1mo";
}

export const TIMEFRAME_CONFIG: Record<ChartTimeframe, TimeframeConfig> = {
  "1D": { id: "1D", label: "1D", days: 1, interval: "5m" },
  "5D": { id: "5D", label: "5D", days: 5, interval: "15m" },
  "1M": { id: "1M", label: "1M", days: 30, interval: "1h" },
  "3M": { id: "3M", label: "3M", days: 90, interval: "1d" },
  "6M": { id: "6M", label: "6M", days: 180, interval: "1d" },
  "1Y": { id: "1Y", label: "1Y", days: 365, interval: "1d" },
};

export const TIMEFRAME_ORDER: ChartTimeframe[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
];
