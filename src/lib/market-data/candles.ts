/**
 * Market data layer — re-exports for API routes and legacy imports.
 * @see ./candles/index.ts
 */
export {
  fetchCandleSeries,
  getCandles,
  trimBarsForDisplay,
  normalizeTimeframeBars,
  aggregateCandles,
  normalizeCandleSymbol,
  getProviderChain,
} from "./candles/index";

export type { GetCandlesParams } from "./candles/types";
