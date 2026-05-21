"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsCategory, NewsFeedResponse } from "@/lib/news/types";

export function useNewsFeed(category: NewsCategory) {
  const [data, setData] = useState<NewsFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/news?category=${category}`, {
        signal: controller.signal,
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          `News API returned ${res.status} (expected JSON, got HTML)`
        );
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const json = (await res.json()) as NewsFeedResponse;
      if (!controller.signal.aborted) {
        setData(json);
        setLoading(false);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Failed to load news");
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchFeed();
    return () => abortRef.current?.abort();
  }, [fetchFeed]);

  return { data, loading, error, refetch: fetchFeed };
}
