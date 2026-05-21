"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TICKER_BAR_SYMBOLS } from "@/lib/market-data/symbols";
import type { MarketQuote } from "@/lib/market-data/types";
import { useMarketData } from "@/providers/MarketDataProvider";

const TICKER_POLL_MS = 12_000;
const TICKER_IDS = TICKER_BAR_SYMBOLS.map((s) => s.id);

export interface LiveTickerState {
  ready: boolean;
  quotes: Record<string, MarketQuote>;
  previousQuotes: Record<string, MarketQuote>;
  getQuote: (id: string) => MarketQuote | undefined;
  getPreviousQuote: (id: string) => MarketQuote | undefined;
  lastFetchedAt: number | null;
}

/**
 * Fast ticker-bar polling without toggling global loading skeletons.
 * Seeds from MarketDataProvider, then refreshes bar symbols every ~12s.
 */
export function useLiveTicker(): LiveTickerState {
  const { getQuote: providerQuote, status, snapshot } = useMarketData();
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [previousQuotes, setPreviousQuotes] = useState<
    Record<string, MarketQuote>
  >({});
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const fetchingRef = useRef(false);

  const seedFromProvider = useCallback(() => {
    const seeded: Record<string, MarketQuote> = {};
    for (const id of TICKER_IDS) {
      const q = providerQuote(id);
      if (q) seeded[id] = q;
    }
    if (Object.keys(seeded).length > 0) {
      setQuotes((prev) => (Object.keys(prev).length > 0 ? prev : seeded));
    }
  }, [providerQuote]);

  useEffect(() => {
    seedFromProvider();
  }, [seedFromProvider, snapshot?.fetchedAt]);

  const poll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const res = await fetch(
        `/api/market/quotes?ids=${TICKER_IDS.join(",")}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;

      const data = (await res.json()) as {
        quotes: Record<string, MarketQuote>;
        fetchedAt?: number;
      };

      const incoming = data.quotes ?? {};
      if (Object.keys(incoming).length === 0) return;

      setQuotes((prev) => {
        setPreviousQuotes(prev);
        return { ...prev, ...incoming };
      });
      setLastFetchedAt(data.fetchedAt ?? Date.now());
    } catch {
      // keep stale quotes
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, TICKER_POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  const getQuote = useCallback(
    (id: string) => quotes[id] ?? providerQuote(id),
    [quotes, providerQuote]
  );

  const getPreviousQuote = useCallback(
    (id: string) => previousQuotes[id],
    [previousQuotes]
  );

  const ready =
    status !== "idle" &&
    (Object.keys(quotes).length > 0 || status === "success");

  return {
    ready,
    quotes,
    previousQuotes,
    getQuote,
    getPreviousQuote,
    lastFetchedAt,
  };
}
