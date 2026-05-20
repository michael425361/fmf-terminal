import "server-only";

import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import {
  isChinaOrientedQuery,
  searchChinaAShares,
} from "./china-a-share-search";
import { searchYahooSymbols } from "./yahoo-client";
import { yahooQuoteToCatalogEntry } from "./symbol-mapper";

export interface MarketSearchResult {
  entry: AssetCatalogEntry;
  exchange?: string;
  quoteType?: string;
}

export async function searchMarketSymbols(
  query: string,
  limit = 16
): Promise<MarketSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const chinaOriented = isChinaOrientedQuery(q);
  const cnLimit = chinaOriented
    ? Math.min(limit, Math.max(8, Math.ceil(limit * 0.6)))
    : Math.min(6, Math.ceil(limit * 0.35));

  const cnResults = searchChinaAShares(q, cnLimit);

  const seen = new Set(
    cnResults.map((r) => r.entry.symbol.toUpperCase())
  );
  const merged: MarketSearchResult[] = [...cnResults];

  const yahooCount = Math.min(limit * 2, 25);
  const rows = await searchYahooSymbols(q, {
    quotesCount: yahooCount,
    lang: chinaOriented ? "zh-CN" : "en-US",
    region: chinaOriented ? "CN" : "US",
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
