import type { MarketSummaryResponse } from "./types";

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  data: MarketSummaryResponse;
}

const cache = new Map<string, CacheEntry>();

export function marketSummaryCacheKey(
  symbol: string,
  market: string,
  locale: string
): string {
  return `${symbol.toUpperCase()}|${market}|${locale}`;
}

export function getCachedMarketSummary(
  key: string
): MarketSummaryResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return { ...entry.data, cached: true };
}

export function setCachedMarketSummary(
  key: string,
  data: MarketSummaryResponse
): void {
  cache.set(key, {
    expiresAt: Date.now() + TTL_MS,
    data: { ...data, cached: false },
  });
}

export function clearMarketSummaryCache(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}
