import type { NewsFeedResponse } from "./types";

interface CacheEntry {
  data: NewsFeedResponse;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function getCachedNews(key: string): NewsFeedResponse | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    return { ...entry.data, stale: true };
  }
  return entry.data;
}

export function setCachedNews(
  key: string,
  data: NewsFeedResponse,
  ttlMs = DEFAULT_TTL_MS
): void {
  store.set(key, {
    data: { ...data, stale: false },
    expiresAt: Date.now() + ttlMs,
  });
}
