import type { MarketSnapshot } from "./types";

interface CacheEntry {
  data: MarketSnapshot;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 15_000;

export function getCachedSnapshot(key: string): MarketSnapshot | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    return { ...entry.data, stale: true };
  }
  return entry.data;
}

export function setCachedSnapshot(
  key: string,
  data: MarketSnapshot,
  ttlMs = DEFAULT_TTL_MS
): void {
  store.set(key, {
    data: { ...data, stale: false },
    expiresAt: Date.now() + ttlMs,
  });
}
