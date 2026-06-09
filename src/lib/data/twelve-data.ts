/**
 * TwelveData client (edge-compatible, `fetch`-based).
 *
 * Provides quotes and lightweight price series used as a cross-provider
 * fallback for the AI context engine. Degrades gracefully to `null`.
 */

const BASE_URL = "https://api.twelvedata.com";
const TIMEOUT_MS = 10_000;

export interface TwelveDataQuote {
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
  price: number;
  change: number;
  percentChange: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  averageVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

function getApiKey(): string | undefined {
  return (
    process.env.TWELVE_DATA_API_KEY?.trim() ||
    process.env.TWELVEDATA_API_KEY?.trim() ||
    undefined
  );
}

export function isTwelveDataConfigured(): boolean {
  return Boolean(getApiKey());
}

async function twelveDataFetch<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    search.set(k, String(v));
  }
  search.set("apikey", apiKey);

  const url = `${BASE_URL}${path}?${search.toString()}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
    const json = (await res.json()) as T & { status?: string; message?: string };
    if (json && typeof json === "object" && "status" in json && json.status === "error") {
      throw new Error(json.message ?? "TwelveData error");
    }
    return json;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[data/twelve-data] request failed:",
        path,
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }
}

interface RawTwelveQuote {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  average_volume?: string;
  fifty_two_week?: { high?: string; low?: string };
}

function toNum(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function fetchTwelveDataQuote(
  symbol: string
): Promise<TwelveDataQuote | null> {
  const raw = await twelveDataFetch<RawTwelveQuote>("/quote", {
    symbol: symbol.toUpperCase(),
  });
  const price = toNum(raw?.close);
  if (!raw || price == null || price <= 0) return null;

  return {
    symbol: raw.symbol ?? symbol.toUpperCase(),
    name: raw.name,
    exchange: raw.exchange,
    currency: raw.currency,
    price,
    change: toNum(raw.change) ?? 0,
    percentChange: toNum(raw.percent_change) ?? 0,
    open: toNum(raw.open),
    high: toNum(raw.high),
    low: toNum(raw.low),
    previousClose: toNum(raw.previous_close),
    volume: toNum(raw.volume),
    averageVolume: toNum(raw.average_volume),
    fiftyTwoWeekHigh: toNum(raw.fifty_two_week?.high),
    fiftyTwoWeekLow: toNum(raw.fifty_two_week?.low),
  };
}

export async function fetchTwelveDataPrice(
  symbol: string
): Promise<number | null> {
  const raw = await twelveDataFetch<{ price?: string }>("/price", {
    symbol: symbol.toUpperCase(),
  });
  const price = toNum(raw?.price);
  return price != null && price > 0 ? price : null;
}
