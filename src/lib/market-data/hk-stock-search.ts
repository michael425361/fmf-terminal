import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import {
  getHKStockDef,
  HK_STOCK_CATALOG,
  HK_STOCK_DEFS,
} from "@/lib/watchlist/hk-stocks";

export interface HKStockSearchResult {
  entry: AssetCatalogEntry;
  exchange?: string;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  const q = normalize(query);
  const t = normalize(target);
  if (t.includes(q)) return 100 + (q.length / Math.max(t.length, 1)) * 50;
  if (t.startsWith(q)) return 90;

  let qi = 0;
  let score = 0;
  let lastMatch = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastMatch === ti - 1 ? 8 : 2;
      lastMatch = ti;
      qi++;
    }
  }
  if (qi < q.length) return 0;
  return score + 10;
}

function scoreHKEntry(entry: AssetCatalogEntry, query: string): number {
  const q = query.trim();
  if (!q) return 0;

  const def = getHKStockDef(entry.id);
  if (!def) return 0;

  const qNorm = normalize(q);
  const code = def.code;
  const symbol = entry.symbol.toUpperCase();

  if (code === q || code === qNorm) return 250;
  if (symbol.toLowerCase() === qNorm || symbol.toLowerCase() === `${qNorm}.hk`) {
    return 240;
  }
  if (def.nameZh === q || def.nameZh.includes(q)) return 200 + q.length;
  if (def.pinyin && (def.pinyin === qNorm || def.pinyin.startsWith(qNorm))) {
    return 180;
  }

  const tokens = [
    code,
    def.nameZh,
    def.nameEn,
    def.pinyin ?? "",
    entry.shortLabel,
    entry.symbol,
    ...(def.extraAliases ?? []),
  ].filter(Boolean);

  let best = 0;
  for (const token of tokens) {
    if (hasChinese(q) && token.includes(q)) best = Math.max(best, 150 + q.length);
    best = Math.max(best, fuzzyScore(q, token));
  }
  return best;
}

export function searchHKStocks(
  query: string,
  limit = 16
): HKStockSearchResult[] {
  const q = query.trim();
  if (!q) return [];

  return HK_STOCK_CATALOG.map((entry) => ({
    entry,
    score: scoreHKEntry(entry, q),
    exchange: "HKEX",
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry, exchange }) => ({ entry, exchange }));
}

export function isHKOrientedQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  if (hasChinese(q)) return true;
  if (/^\d{4}(\.hk)?$/i.test(q)) return true;
  return HK_STOCK_DEFS.some(
    (d) =>
      d.extraAliases?.some((a) => normalize(a) === normalize(q)) ||
      d.pinyin === normalize(q)
  );
}
