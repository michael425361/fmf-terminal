import { ASSET_CATALOG } from "@/lib/watchlist/catalog";
import { getCatalogEntryById } from "@/lib/watchlist/catalog-registry";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import { resolveExchangeCode } from "@/lib/chart/header-metrics";
import { ASSET_SEARCH_ALIASES, GLOBAL_QUERY_ALIASES } from "./aliases";
import type { SearchEngineOptions, SearchResultItem } from "./types";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Simple subsequence fuzzy match score (higher = better), 0 = no match */
function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  const q = normalize(query);
  const t = normalize(target);
  if (t.includes(q)) return 100 + (q.length / t.length) * 50;
  if (t.startsWith(q)) return 90;

  let qi = 0;
  let score = 0;
  let lastMatch = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      const consecutive = lastMatch === ti - 1 ? 8 : 2;
      score += consecutive;
      lastMatch = ti;
      qi++;
    }
  }
  if (qi < q.length) return 0;
  return score + 10;
}

export function highlightRanges(text: string, query: string): Array<[number, number]> {
  const q = normalize(query);
  if (!q) return [];
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx >= 0) return [[idx, idx + q.length]];

  const ranges: Array<[number, number]> = [];
  let qi = 0;
  for (let i = 0; i < text.length && qi < q.length; i++) {
    if (text[i].toLowerCase() === q[qi]) {
      ranges.push([i, i + 1]);
      qi++;
    }
  }
  if (ranges.length === 0) return [];
  const merged: Array<[number, number]> = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && last[1] === s) last[1] = e;
    else merged.push([s, e]);
  }
  return merged;
}

function tokensForEntry(
  entry: AssetCatalogEntry,
  localizedNames?: Record<string, string>
): string[] {
  const localized = localizedNames?.[entry.id];
  const aliases = ASSET_SEARCH_ALIASES[entry.id] ?? [];
  return [
    entry.id,
    entry.symbol,
    entry.shortLabel,
    entry.name,
    localized ?? "",
    entry.assetType,
    entry.category,
    ...aliases,
  ].filter(Boolean);
}

function scoreEntry(
  entry: AssetCatalogEntry,
  query: string,
  localizedNames?: Record<string, string>,
  favoriteIds?: Set<string>,
  recentRank?: number
): number {
  const q = normalize(query);
  if (!q) {
    let base = 1;
    if (favoriteIds?.has(entry.id)) base += 50;
    if (recentRank != null) base += Math.max(0, 30 - recentRank * 3);
    return base;
  }

  let best = 0;
  for (const token of tokensForEntry(entry, localizedNames)) {
    best = Math.max(best, fuzzyScore(q, token));
  }

  if (normalize(entry.shortLabel) === q || normalize(entry.symbol) === q) {
    best += 80;
  }

  if (favoriteIds?.has(entry.id)) best += 15;
  if (recentRank != null) best += Math.max(0, 12 - recentRank);

  return best;
}

export function resolveAliasToId(query: string): string | undefined {
  const q = normalize(query);
  if (GLOBAL_QUERY_ALIASES[q]) return GLOBAL_QUERY_ALIASES[q];
  for (const [alias, id] of Object.entries(GLOBAL_QUERY_ALIASES)) {
    if (alias.includes(q) || q.includes(alias)) return id;
  }
  return undefined;
}

export function searchAssets(
  options: SearchEngineOptions
): SearchResultItem[] {
  const { query, limit = 24, localizedNames, favoriteIds, recentIds = [] } =
    options;
  const q = normalize(query);

  const aliasId = q ? resolveAliasToId(q) : undefined;
  const aliasEntry = aliasId ? getCatalogEntryById(aliasId) : undefined;

  const recentIndex = new Map(recentIds.map((id, i) => [id, i]));

  const scored = ASSET_CATALOG.map((entry) => {
    const recentRank = recentIndex.get(entry.id);
    const score = scoreEntry(
      entry,
      q,
      localizedNames,
      favoriteIds,
      recentRank
    );
    const displayName = localizedNames?.[entry.id] ?? entry.name;
    return {
      entry,
      score,
      displayName,
      exchange: resolveExchangeCode(entry),
      highlights: highlightRanges(
        `${entry.shortLabel} ${displayName}`,
        q
      ),
    };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (aliasEntry) {
    const exists = scored.some((s) => s.entry.id === aliasEntry.id);
    if (!exists) {
      scored.unshift({
        entry: aliasEntry,
        score: 200,
        displayName: localizedNames?.[aliasEntry.id] ?? aliasEntry.name,
        exchange: resolveExchangeCode(aliasEntry),
        highlights: highlightRanges(aliasEntry.shortLabel, q),
      });
    } else {
      const item = scored.find((s) => s.entry.id === aliasEntry.id);
      if (item) item.score += 100;
      scored.sort((a, b) => b.score - a.score);
    }
  }

  return scored.slice(0, limit);
}

export function catalogEntriesToSearchResults(
  entries: AssetCatalogEntry[],
  query: string,
  localizedNames?: Record<string, string>
): SearchResultItem[] {
  const q = normalize(query);
  return entries.map((entry, i) => {
    const displayName = localizedNames?.[entry.id] ?? entry.name;
    const highlightText = `${entry.shortLabel} ${displayName}`;
    return {
      entry,
      score: 100 - i,
      displayName,
      exchange: resolveExchangeCode(entry),
      highlights: highlightRanges(highlightText, q),
    };
  });
}

export function getEntriesByIds(ids: string[]): AssetCatalogEntry[] {
  return ids
    .map((id) => getCatalogEntryById(id))
    .filter((e): e is AssetCatalogEntry => Boolean(e));
}
