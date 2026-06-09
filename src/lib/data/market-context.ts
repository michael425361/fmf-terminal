/**
 * Market environment + sector performance (edge-compatible).
 *
 * Pulls major-index and sector-ETF quotes from Finnhub to derive a coarse
 * market regime (bullish / bearish / neutral) plus sector leadership/laggards.
 * Used by the AI context engine so every analysis is grounded in the
 * prevailing tape rather than the single ticker in isolation.
 */

import { fetchFinnhubQuote } from "./finnhub";

export type MarketTrend = "bullish" | "bearish" | "neutral";

export interface IndexQuote {
  symbol: string;
  label: string;
  changePercent: number;
}

export interface SectorQuote {
  symbol: string;
  label: string;
  changePercent: number;
}

export interface MarketEnvironment {
  trend: MarketTrend;
  breadth: number; // -1..1 share of indices/sectors advancing
  indices: IndexQuote[];
  sectors: SectorQuote[];
  topSector: SectorQuote | null;
  bottomSector: SectorQuote | null;
  asOf: number;
}

const INDICES: Array<{ symbol: string; label: string }> = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "QQQ", label: "Nasdaq 100" },
  { symbol: "DIA", label: "Dow Jones" },
  { symbol: "IWM", label: "Russell 2000" },
];

const SECTORS: Array<{ symbol: string; label: string }> = [
  { symbol: "XLK", label: "Technology" },
  { symbol: "XLF", label: "Financials" },
  { symbol: "XLE", label: "Energy" },
  { symbol: "XLV", label: "Health Care" },
  { symbol: "XLY", label: "Consumer Discretionary" },
  { symbol: "XLP", label: "Consumer Staples" },
  { symbol: "XLI", label: "Industrials" },
  { symbol: "XLU", label: "Utilities" },
  { symbol: "XLB", label: "Materials" },
  { symbol: "XLRE", label: "Real Estate" },
];

async function quotePercent(symbol: string): Promise<number | null> {
  const quote = await fetchFinnhubQuote(symbol);
  if (!quote || typeof quote.dp !== "number" || Number.isNaN(quote.dp)) {
    return null;
  }
  return quote.dp;
}

function classifyTrend(avgPercent: number, breadth: number): MarketTrend {
  if (avgPercent > 0.35 && breadth > 0.25) return "bullish";
  if (avgPercent < -0.35 && breadth < -0.25) return "bearish";
  return "neutral";
}

/** Snapshot of the broad market regime and sector rotation. */
export async function getMarketEnvironment(): Promise<MarketEnvironment> {
  const [indexResults, sectorResults] = await Promise.all([
    Promise.all(
      INDICES.map(async (i) => ({ ...i, changePercent: await quotePercent(i.symbol) }))
    ),
    Promise.all(
      SECTORS.map(async (s) => ({ ...s, changePercent: await quotePercent(s.symbol) }))
    ),
  ]);

  const indices: IndexQuote[] = indexResults
    .filter((i): i is IndexQuote & { changePercent: number } => i.changePercent != null)
    .map((i) => ({ symbol: i.symbol, label: i.label, changePercent: i.changePercent }));

  const sectors: SectorQuote[] = sectorResults
    .filter((s): s is SectorQuote & { changePercent: number } => s.changePercent != null)
    .map((s) => ({ symbol: s.symbol, label: s.label, changePercent: s.changePercent }));

  const sample = [...indices, ...sectors];
  const avgPercent =
    sample.length > 0
      ? sample.reduce((sum, q) => sum + q.changePercent, 0) / sample.length
      : 0;

  const advancing = sample.filter((q) => q.changePercent > 0).length;
  const declining = sample.filter((q) => q.changePercent < 0).length;
  const breadth =
    sample.length > 0 ? (advancing - declining) / sample.length : 0;

  const sortedSectors = [...sectors].sort(
    (a, b) => b.changePercent - a.changePercent
  );

  return {
    trend: classifyTrend(avgPercent, breadth),
    breadth: Number(breadth.toFixed(2)),
    indices,
    sectors,
    topSector: sortedSectors[0] ?? null,
    bottomSector: sortedSectors[sortedSectors.length - 1] ?? null,
    asOf: Date.now(),
  };
}
