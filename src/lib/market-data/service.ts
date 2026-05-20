import { getCachedSnapshot, setCachedSnapshot } from "./cache";
import { DEFAULT_CHART_SYMBOL, MARKET_SYMBOLS } from "./symbols";
import type { MarketSnapshot } from "./types";
import {
  fetchYahooChart,
  fetchYahooQuotes,
  mergeQuotesWithDefinitions,
} from "./yahoo-client";

const SNAPSHOT_CACHE_KEY = "global-macro-snapshot";

export async function getMarketSnapshot(
  options: { force?: boolean } = {}
): Promise<MarketSnapshot> {
  if (!options.force) {
    const cached = getCachedSnapshot(SNAPSHOT_CACHE_KEY);
    if (cached && !cached.stale) {
      return cached;
    }
  }

  const { quotes, errors } = await fetchYahooQuotes(MARKET_SYMBOLS);
  const snapshot: MarketSnapshot = {
    quotes: mergeQuotesWithDefinitions(quotes),
    errors,
    fetchedAt: Date.now(),
    stale: false,
  };

  setCachedSnapshot(SNAPSHOT_CACHE_KEY, snapshot);
  return snapshot;
}

export async function getChartSeries(
  symbol: string = DEFAULT_CHART_SYMBOL
) {
  return fetchYahooChart(symbol);
}

export async function getQuotesForSymbols(
  definitions: import("./types").MarketSymbolDefinition[]
) {
  const { quotes, errors } = await fetchYahooQuotes(definitions);
  return {
    quotes: mergeQuotesWithDefinitions(quotes),
    errors,
    fetchedAt: Date.now(),
  };
}

export async function getSparklinesForSymbols(symbols: string[]) {
  const { fetchYahooSparklines } = await import("./yahoo-client");
  return fetchYahooSparklines(symbols);
}

export { MARKET_SYMBOLS, TICKER_BAR_SYMBOLS, CATEGORY_ORDER } from "./symbols";
export type { MarketQuote, MarketSnapshot, MarketCategory } from "./types";
