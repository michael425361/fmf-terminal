"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CandleSeriesResponse,
  ChartTimeframe,
} from "@/lib/chart/types";

interface UseChartDataOptions {
  symbol: string | null;
  timeframe: ChartTimeframe;
  refreshIntervalMs?: number;
}

export function useChartData({
  symbol,
  timeframe,
  refreshIntervalMs = 30_000,
}: UseChartDataOptions) {
  const [data, setData] = useState<CandleSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = `/api/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`;
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const json = (await res.json()) as CandleSeriesResponse;
      if (!controller.signal.aborted) {
        setData(json);
        setLoading(false);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Failed to load chart");
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, refreshIntervalMs);
    return () => {
      clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [fetchData, refreshIntervalMs]);

  return { data, loading, error, refetch: fetchData };
}
