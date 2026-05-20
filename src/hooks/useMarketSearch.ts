"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";

interface UseMarketSearchOptions {
  query: string;
  enabled?: boolean;
  limit?: number;
  debounceMs?: number;
}

export function useMarketSearch({
  query,
  enabled = true,
  limit = 16,
  debounceMs = 280,
}: UseMarketSearchOptions) {
  const [results, setResults] = useState<AssetCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const url = `/api/market/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { results: AssetCatalogEntry[] };
        if (!controller.signal.aborted) {
          setResults(data.results ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => search(trimmed), debounceMs);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, enabled, debounceMs, search]);

  return { results, loading, error };
}
