import "server-only";

import type { CandleSeriesResponse, ChartTimeframe } from "@/lib/chart/types";
import {
  detectMarketFromSymbol,
  normalizeYahooSymbol,
  type DetectedMarket,
} from "../symbol-normalize";
import { resolveTimeframeResolution } from "@/lib/chart/timeframe-resolution";
import { getCandles } from "./get-candles";
import {
  buildSeriesFromRaw,
  buildUnavailableResponse,
  trimBarsForDisplay,
} from "./pipeline";
import {
  candleCacheKey,
  getCachedCandleSeries,
  setCachedCandleSeries,
} from "./cache";

export { getCandles } from "./get-candles";
export type { GetCandlesParams } from "./types";
export {
  trimBarsForDisplay,
  normalizeTimeframeBars,
  aggregateCandles,
} from "./pipeline";
export { normalizeCandleSymbol } from "./normalize";
export { getProviderChain, getPrimaryProvider } from "./registry";

/** Chart API entry — unchanged contract for TradingChart / useChartData. */
export async function fetchCandleSeries(
  symbol: string,
  timeframe: ChartTimeframe
): Promise<CandleSeriesResponse> {
  const normalized = normalizeYahooSymbol(symbol);
  const market = detectMarketFromSymbol(normalized);
  const cacheKey = candleCacheKey(normalized, timeframe);

  const cached = getCachedCandleSeries(cacheKey);
  if (cached && !cached.unavailable && cached.bars.length >= 2) {
    return cached;
  }

  const raw = await getCandles({
    symbol: normalized,
    market,
    interval: resolveTimeframeResolution(timeframe, market).interval,
    timeframe,
  });

  if (!raw) {
    return buildUnavailableResponse(normalized, timeframe, market);
  }

  const series = buildSeriesFromRaw(raw, symbol, timeframe, market);
  if (!series) {
    return buildUnavailableResponse(normalized, timeframe, market);
  }

  setCachedCandleSeries(cacheKey, series);
  return series;
}
