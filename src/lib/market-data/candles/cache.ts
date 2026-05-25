import "server-only";

import type { CandleSeriesResponse, ChartTimeframe } from "@/lib/chart/types";

const CACHE_TTL_MS = 15_000;

interface CacheEntry {
  expiresAt: number;
  data: CandleSeriesResponse;
}

const memoryCache = new Map<string, CacheEntry>();

export function candleCacheKey(
  symbol: string,
  timeframe: ChartTimeframe
): string {
  return `${symbol.toUpperCase()}|${timeframe}`;
}

export function getCachedCandleSeries(
  key: string
): CandleSeriesResponse | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedCandleSeries(
  key: string,
  data: CandleSeriesResponse
): void {
  memoryCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
}
