import type { OHLCVBar } from "@/lib/chart/types";
import type { MarketQuote } from "@/lib/market-data/types";
import {
  formatCompactNumber,
  formatEarningsDate,
  formatMarketCap,
  formatPeRatio,
  formatQuotePrice,
  formatVolume,
} from "@/lib/market-data/format";
import type { AssetCatalogEntry, AssetType, WatchlistItemView } from "@/lib/watchlist/types";

export type HeaderMetricKey =
  | "open"
  | "high"
  | "low"
  | "prevClose"
  | "volume"
  | "marketCap"
  | "pe"
  | "earnings"
  | "volume24h"
  | "dominance"
  | "contractMonth"
  | "openInterest"
  | "dailyRange"
  | "session";

export interface HeaderMetricItem {
  key: HeaderMetricKey;
  value: string;
}

export interface SessionOhlcv {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export function sessionOhlcvFromBars(bars: OHLCVBar[]): SessionOhlcv {
  if (bars.length === 0) return {};

  const open = bars[0].open;
  const close = bars[bars.length - 1].close;
  let high = bars[0].high;
  let low = bars[0].low;
  let volume = 0;

  for (const bar of bars) {
    high = Math.max(high, bar.high);
    low = Math.min(low, bar.low);
    volume += bar.volume;
  }

  return { open, high, low, close, volume };
}

function fmtPrice(
  value: number | undefined,
  quote: MarketQuote | undefined,
  category?: string
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatQuotePrice(
    value,
    quote?.priceDecimals ?? 2,
    category ?? quote?.category
  );
}

function isUsEquity(assetType: AssetType): boolean {
  return assetType === "us_stock" || assetType === "etf";
}

export function buildCoreMetrics(
  asset: WatchlistItemView,
  quote: MarketQuote | undefined,
  bars: OHLCVBar[]
): HeaderMetricItem[] {
  const fallback = sessionOhlcvFromBars(bars);
  const cat = asset.category === "etf" ? "us" : asset.category;

  const open = quote?.open ?? fallback.open;
  const high = quote?.high ?? fallback.high;
  const low = quote?.low ?? fallback.low;
  const prevClose = quote?.previousClose;
  const volume = quote?.volume ?? fallback.volume;

  const fmt = (v: number | undefined) =>
    fmtPrice(v, quote, cat);

  return [
    { key: "open", value: fmt(open) },
    { key: "high", value: fmt(high) },
    { key: "low", value: fmt(low) },
    { key: "prevClose", value: fmt(prevClose) },
    {
      key: "volume",
      value: formatVolume(
        volume,
        cat === "hk" || cat === "tw" ? cat : undefined
      ),
    },
  ];
}

export function buildAssetSpecificMetrics(
  asset: WatchlistItemView,
  quote: MarketQuote | undefined,
  locale: string,
  sessionLabel: string
): HeaderMetricItem[] {
  const metrics: HeaderMetricItem[] = [];

  if (isUsEquity(asset.assetType)) {
    metrics.push(
      { key: "marketCap", value: formatMarketCap(quote?.marketCap) },
      {
        key: "pe",
        value: formatPeRatio(quote?.trailingPE ?? quote?.forwardPE),
      },
      {
        key: "earnings",
        value: formatEarningsDate(quote?.earningsTimestamp, locale),
      }
    );
    return metrics;
  }

  if (asset.assetType === "crypto") {
    metrics.push(
      {
        key: "volume24h",
        value: formatVolume(quote?.volume24h ?? quote?.volume),
      },
      { key: "dominance", value: "—" }
    );
    return metrics;
  }

  if (asset.assetType === "commodity") {
    metrics.push(
      {
        key: "contractMonth",
        value: quote?.contractMonth ?? "—",
      },
      {
        key: "openInterest",
        value:
          quote?.openInterest != null
            ? formatCompactNumber(quote.openInterest)
            : "—",
      }
    );
    return metrics;
  }

  if (asset.assetType === "forex") {
    const high = quote?.high;
    const low = quote?.low;
    const range =
      high != null && low != null && Number.isFinite(high) && Number.isFinite(low)
        ? `${fmtPrice(low, quote, "fx")} – ${fmtPrice(high, quote, "fx")}`
        : "—";
    metrics.push(
      { key: "dailyRange", value: range },
      { key: "session", value: sessionLabel }
    );
    return metrics;
  }

  return metrics;
}

export function resolveExchangeCode(
  asset: Pick<AssetCatalogEntry, "assetType">,
  quote?: MarketQuote
): string {
  if (quote?.exchange) return quote.exchange;
  if (quote?.fullExchangeName) return quote.fullExchangeName;

  const map: Record<AssetType, string> = {
    us_stock: "NASDAQ/NYSE",
    etf: "US",
    cn_stock: "SSE/SZSE",
    hk_stock: "HKEX",
    tw_stock: "TWSE",
    index: "INDEX",
    forex: "FX",
    crypto: "CRYPTO",
    commodity: "CME/NYMEX",
  };
  return map[asset.assetType] ?? "—";
}
