/**
 * Finnhub data client (edge-compatible, `fetch`-based).
 *
 * Used by the AI intelligence layer for company news, analyst actions,
 * fundamentals and earnings. All functions degrade gracefully to `null` / `[]`
 * when the API key is missing or a request fails, so callers never throw.
 */

const BASE_URL = "https://finnhub.io/api/v1";
const TIMEOUT_MS = 10_000;

export interface FinnhubNewsArticle {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
}

export interface FinnhubProfile {
  name?: string;
  ticker?: string;
  exchange?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  ipo?: string;
  weburl?: string;
  country?: string;
  currency?: string;
  logo?: string;
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
  symbol: string;
}

export interface FinnhubEarningSurprise {
  actual: number | null;
  estimate: number | null;
  period: string;
  quarter?: number;
  year?: number;
  surprise: number | null;
  surprisePercent: number | null;
  symbol?: string;
}

export interface FinnhubMetrics {
  metric?: Record<string, number | string | null>;
  series?: Record<string, unknown>;
}

export interface FinnhubQuote {
  c?: number; // current price
  d?: number; // change
  dp?: number; // percent change
  h?: number; // high
  l?: number; // low
  o?: number; // open
  pc?: number; // previous close
  t?: number; // timestamp
}

function getApiKey(): string | undefined {
  return process.env.FINNHUB_API_KEY?.trim() || undefined;
}

export function isFinnhubConfigured(): boolean {
  return Boolean(getApiKey());
}

async function finnhubFetch<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T | null> {
  const token = getApiKey();
  if (!token) return null;

  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    search.set(k, String(v));
  }
  search.set("token", token);

  const url = `${BASE_URL}${path}?${search.toString()}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`Finnhub HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[data/finnhub] request failed:",
        path,
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Company-specific news for the trailing `days` window. */
export async function fetchFinnhubCompanyNews(
  symbol: string,
  days = 14
): Promise<FinnhubNewsArticle[]> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const data = await finnhubFetch<FinnhubNewsArticle[]>("/company-news", {
    symbol: symbol.toUpperCase(),
    from: ymd(from),
    to: ymd(to),
  });
  if (!Array.isArray(data)) return [];
  return data.filter((a) => a.headline && a.url);
}

export type FinnhubMarketCategory = "general" | "forex" | "crypto" | "merger";

/** Broad market news by category. */
export async function fetchFinnhubMarketNews(
  category: FinnhubMarketCategory = "general"
): Promise<FinnhubNewsArticle[]> {
  const data = await finnhubFetch<FinnhubNewsArticle[]>("/news", { category });
  if (!Array.isArray(data)) return [];
  return data.filter((a) => a.headline && a.url);
}

export async function fetchFinnhubProfile(
  symbol: string
): Promise<FinnhubProfile | null> {
  const data = await finnhubFetch<FinnhubProfile>("/stock/profile2", {
    symbol: symbol.toUpperCase(),
  });
  if (!data || !data.name) return null;
  return data;
}

/** Analyst recommendation trend (most recent period first). */
export async function fetchFinnhubRecommendations(
  symbol: string
): Promise<FinnhubRecommendation[]> {
  const data = await finnhubFetch<FinnhubRecommendation[]>(
    "/stock/recommendation",
    { symbol: symbol.toUpperCase() }
  );
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => (a.period < b.period ? 1 : -1));
}

/** Historical EPS surprises (most recent first). */
export async function fetchFinnhubEarnings(
  symbol: string
): Promise<FinnhubEarningSurprise[]> {
  const data = await finnhubFetch<FinnhubEarningSurprise[]>("/stock/earnings", {
    symbol: symbol.toUpperCase(),
  });
  if (!Array.isArray(data)) return [];
  return data;
}

export async function fetchFinnhubMetrics(
  symbol: string
): Promise<FinnhubMetrics | null> {
  return finnhubFetch<FinnhubMetrics>("/stock/metric", {
    symbol: symbol.toUpperCase(),
    metric: "all",
  });
}

export async function fetchFinnhubQuote(
  symbol: string
): Promise<FinnhubQuote | null> {
  const data = await finnhubFetch<FinnhubQuote>("/quote", {
    symbol: symbol.toUpperCase(),
  });
  if (!data || typeof data.c !== "number" || data.c <= 0) return null;
  return data;
}
