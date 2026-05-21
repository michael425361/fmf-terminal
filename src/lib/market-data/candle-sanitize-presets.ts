import type { ChartTimeframe } from "@/lib/chart/types";
import type { SanitizeCandleOptions } from "@/lib/chart/sanitize-candles";
import type { DetectedMarket } from "./symbol-normalize";

const INTRADAY = new Set<ChartTimeframe>(["1D", "5D"]);

/** Minimal sanitization for HK/TW — keep real Yahoo OHLCV, only validate structure. */
export function getSanitizeOptionsForMarket(
  market: DetectedMarket,
  symbol: string,
  timeframe: ChartTimeframe
): SanitizeCandleOptions {
  const base: SanitizeCandleOptions = {
    symbol,
    timeframe,
    logWarnings: true,
  };

  if (market === "hk" || market === "tw") {
    return {
      ...base,
      allowZeroVolumeIntraday: true,
      skipSpikeFilter: true,
      skipThinVolumeAnomaly: true,
      maxBodyMoveFromPrev: 2,
      maxHighVsMedian: 2,
      maxLowVsMedian: 2,
      wickExcessThreshold: 0.95,
      wickBodyMoveMax: 0.95,
    };
  }

  if (timeframe && INTRADAY.has(timeframe)) {
    return base;
  }

  return { ...base, skipThinVolumeAnomaly: true };
}
