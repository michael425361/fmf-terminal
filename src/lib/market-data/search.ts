import "server-only";

import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import {
  isChinaOrientedQuery,
  searchChinaAShares,
} from "./china-a-share-search";
import { isHKOrientedQuery, searchHKStocks } from "./hk-stock-search";
import { isTWOrientedQuery, searchTWStocks } from "./tw-stock-search";
import { searchYahooSymbols } from "./yahoo-client";
import { yahooQuoteToCatalogEntry } from "./symbol-mapper";

export interface MarketSearchResult {
  entry: AssetCatalogEntry;
  exchange?: string;
  quoteType?: string;
}

function isEastAsiaOrientedQuery(query: string): boolean {
  return (
    isChinaOrientedQuery(query) ||
    isHKOrientedQuery(query) ||
    isTWOrientedQuery(query)
  );
}

export async function searchMarketSymbols(
  query: string,
  limit = 16
): Promise<MarketSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const eastAsia = isEastAsiaOrientedQuery(q);
  const localShare = eastAsia
    ? Math.min(limit, Math.max(10, Math.ceil(limit * 0.65)))
    : Math.min(8, Math.ceil(limit * 0.4));

  const perLocal = Math.max(3, Math.ceil(localShare / 3));

  const cnResults = searchChinaAShares(q, perLocal);
  const hkResults = searchHKStocks(q, perLocal);
  const twResults = searchTWStocks(q, perLocal);

  const seen = new Set(
    [...cnResults, ...hkResults, ...twResults].map((r) =>
      r.entry.symbol.toUpperCase()
    )
  );
  const merged: MarketSearchResult[] = [
    ...cnResults,
    ...hkResults,
    ...twResults,
  ];

  const yahooCount = Math.min(limit * 2, 25);
  const rows = await searchYahooSymbols(q, {
    quotesCount: yahooCount,
    lang: eastAsia ? "zh-CN" : "en-US",
    region: eastAsia ? "CN" : "US",
  });

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const entry = yahooQuoteToCatalogEntry({
      symbol: row.symbol ?? "",
      shortname:
        (r.shortname as string | undefined) ??
        (r.shortName as string | undefined),
      longname:
        (r.longname as string | undefined) ??
        (r.longName as string | undefined),
      quoteType: row.quoteType,
      exchange: row.exchange ?? row.fullExchangeName,
      isYahooFinance: true,
    });

    if (!entry) continue;
    const key = entry.symbol.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);

    merged.push({
      entry,
      exchange: row.exchange ?? row.fullExchangeName,
      quoteType: row.quoteType,
    });

    if (merged.length >= limit) break;
  }

  return merged.slice(0, limit);
}
