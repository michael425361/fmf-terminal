"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CandleSeriesResponse,
  ChartTimeframe,
} from "@/lib/chart/types";
import {
  detectMarketFromSymbol,
  normalizeYahooSymbol,
} from "@/lib/market-data/symbol-normalize";

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
  const [unavailable, setUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      setUnavailable(false);
      return;
    }
    setLoading(true);
    setUnavailable(false);
  }, [symbol, timeframe]);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      setUnavailable(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const providerSymbol = normalizeYahooSymbol(symbol);
      const market = detectMarketFromSymbol(providerSymbol);

      console.log("Fetching candle data:", {
        symbol,
        providerSymbol,
        interval: timeframe,
        market,
      });

      const url = `/api/market/candles?symbol=${encodeURIComponent(providerSymbol)}&timeframe=${timeframe}`;
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          `Chart API returned ${res.status} (expected JSON, got HTML)`
        );
      }

      const json = (await res.json()) as CandleSeriesResponse;

      console.log("Candle API response:", {
        status: res.status,
        barCount: json.bars?.length ?? 0,
        unavailable: json.unavailable,
        provider: json.debug?.provider,
      });

      if (controller.signal.aborted) return;

      const isUnavailable =
        json.unavailable === true || (json.bars?.length ?? 0) < 2;

      if (isUnavailable) {
        setUnavailable(true);
        if ((json.bars?.length ?? 0) >= 2) {
          setData(json);
        }
      } else {
        setUnavailable(false);
        setData(json);
      }

      setLoading(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      setUnavailable(true);
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

  return { data, loading, unavailable, refetch: fetchData };
}
