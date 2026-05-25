import type { DetectedMarket } from "../symbol-normalize";
import {
  normalizeYahooSymbol,
  padHKCode,
  getYahooChartSymbolCandidates,
} from "../symbol-normalize";
import type { CandleProviderId } from "../providers/types";

/** Canonical symbol for cache keys and API responses. */
export function normalizeCandleSymbol(
  symbol: string,
  market?: DetectedMarket
): string {
  return normalizeYahooSymbol(symbol);
}

/** Provider-specific ticker formatting. */
export function toProviderSymbol(
  symbol: string,
  market: DetectedMarket,
  provider: CandleProviderId
): string {
  const canonical = normalizeCandleSymbol(symbol, market);
  const upper = canonical.toUpperCase();

  if (provider === "yahoo") {
    return getYahooChartSymbolCandidates(canonical)[0] ?? canonical;
  }

  if (provider === "finnhub") {
    if (upper.startsWith("^")) return upper.slice(1);
    return upper.split(".")[0];
  }

  if (provider === "twelvedata") {
    if (upper.endsWith(".HK")) {
      return padHKCode(upper.slice(0, -3));
    }
    if (upper.endsWith(".TW")) {
      return upper.slice(0, -3).replace(/^0+/, "") || upper.slice(0, -3);
    }
    if (upper.endsWith(".SS") || upper.endsWith(".SZ")) {
      return upper.replace(".SS", "").replace(".SZ", "");
    }
    return upper.split(".")[0];
  }

  if (provider === "binance") {
    const base = upper.replace(/-USD$/, "").replace(/-USDT$/, "");
    return `${base}USDT`;
  }

  return canonical;
}

export function twelveDataExchange(market: DetectedMarket): string | undefined {
  if (market === "hk") return "HKEX";
  if (market === "tw") return "TWSE";
  if (market === "cn") return "SSE";
  return undefined;
}
