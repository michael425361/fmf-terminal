"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_CHART_SYMBOL } from "@/lib/market-data/symbols";
import type {
  MarketChartSeries,
  MarketDataState,
  MarketQuote,
  MarketSnapshot,
} from "@/lib/market-data/types";

const REFRESH_MS = 30_000;

interface MarketDataContextValue extends MarketDataState {
  refresh: () => Promise<void>;
  getQuote: (id: string) => MarketQuote | undefined;
  getPreviousQuote: (id: string) => MarketQuote | undefined;
  chartSymbol: string;
  setChartSymbol: (symbol: string) => void;
  watchlistQuotes: Record<string, MarketQuote>;
  watchlistSparklines: Record<string, number[]>;
  loadWatchlistMarketData: (ids: string[]) => Promise<void>;
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null);

const initialState: MarketDataState = {
  status: "idle",
  snapshot: null,
  previousQuotes: {},
  chart: null,
  lastError: null,
};

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketDataState>(initialState);
  const [chartSymbol, setChartSymbol] = useState(DEFAULT_CHART_SYMBOL);
  const [watchlistQuotes, setWatchlistQuotes] = useState<
    Record<string, MarketQuote>
  >({});
  const [watchlistSparklines, setWatchlistSparklines] = useState<
    Record<string, number[]>
  >({});
  const [prevWatchlistQuotes, setPrevWatchlistQuotes] = useState<
    Record<string, MarketQuote>
  >({});

  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const chartSymbolRef = useRef(chartSymbol);
  const watchlistIdsRef = useRef<string[]>([]);

  chartSymbolRef.current = chartSymbol;

  const loadWatchlistMarketData = useCallback(async (ids: string[]) => {
    watchlistIdsRef.current = ids;
    if (ids.length === 0) return;

    try {
      const [quotesRes, sparkRes] = await Promise.all([
        fetch(`/api/market/quotes?ids=${ids.join(",")}`, { cache: "no-store" }),
        fetch(`/api/market/sparklines?ids=${ids.join(",")}`, {
          cache: "no-store",
        }),
      ]);

      if (!isMounted.current) return;

      if (quotesRes.ok) {
        const data = (await quotesRes.json()) as {
          quotes: Record<string, MarketQuote>;
        };
        setWatchlistQuotes((prev) => {
          setPrevWatchlistQuotes(prev);
          return data.quotes ?? {};
        });
      }

      if (sparkRes.ok) {
        const sparks = (await sparkRes.json()) as Record<string, number[]>;
        setWatchlistSparklines(sparks);
      }
    } catch {
      // graceful — keep stale watchlist quotes
    }
  }, []);

  const applySnapshot = useCallback(
    (snapshot: MarketSnapshot, chart: MarketChartSeries | null) => {
      setState((prev) => ({
        status: "success",
        snapshot,
        previousQuotes:
          prev.snapshot?.quotes ?? prev.previousQuotes ?? {},
        chart: chart ?? prev.chart,
        lastError:
          snapshot.errors.length > 0 &&
          Object.keys(snapshot.quotes).length === 0
            ? "partial"
            : null,
      }));
    },
    []
  );

  const refresh = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    setState((prev) => ({
      ...prev,
      status: prev.snapshot ? "success" : "loading",
    }));

    try {
      const [marketRes] = await Promise.all([
        fetch("/api/market", { cache: "no-store" }),
        loadWatchlistMarketData(watchlistIdsRef.current),
      ]);

      if (!isMounted.current) return;

      const snapshot = (await marketRes.json()) as MarketSnapshot;

      if (!marketRes.ok && Object.keys(snapshot.quotes ?? {}).length === 0) {
        setState((prev) => ({
          ...prev,
          status: "error",
          lastError: snapshot.errors[0]?.message ?? "Market data unavailable",
        }));
        return;
      }

      applySnapshot(snapshot, null);
    } catch (err) {
      if (!isMounted.current) return;
      setState((prev) => ({
        ...prev,
        status: "error",
        lastError:
          err instanceof Error ? err.message : "Market data unavailable",
      }));
    } finally {
      isFetching.current = false;
    }
  }, [applySnapshot, loadWatchlistMarketData]);

  useEffect(() => {
    isMounted.current = true;
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [refresh]);

  const getQuote = useCallback(
    (id: string) =>
      watchlistQuotes[id] ?? state.snapshot?.quotes[id],
    [watchlistQuotes, state.snapshot?.quotes]
  );

  const getPreviousQuote = useCallback(
    (id: string) =>
      prevWatchlistQuotes[id] ?? state.previousQuotes[id],
    [prevWatchlistQuotes, state.previousQuotes]
  );

  const value = useMemo<MarketDataContextValue>(
    () => ({
      ...state,
      refresh,
      getQuote,
      getPreviousQuote,
      chartSymbol,
      setChartSymbol,
      watchlistQuotes,
      watchlistSparklines,
      loadWatchlistMarketData,
    }),
    [
      state,
      refresh,
      getQuote,
      getPreviousQuote,
      chartSymbol,
      watchlistQuotes,
      watchlistSparklines,
      loadWatchlistMarketData,
    ]
  );

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) {
    throw new Error("useMarketData must be used within MarketDataProvider");
  }
  return ctx;
}
