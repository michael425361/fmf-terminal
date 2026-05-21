import type { MarketQuote } from "./types";
import type { DetectedMarket } from "./symbol-normalize";

export function formatQuotePrice(
  price: number,
  decimals = 2,
  category?: string
): string {
  if (category === "fx" && price < 50) {
    return price.toFixed(decimals);
  }
  if (price >= 1_000_000) {
    return price.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
  }
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return price.toFixed(decimals);
}

export function formatSignedChange(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function isQuotePositive(quote: MarketQuote): boolean {
  if (quote.invertColors) {
    return quote.change < 0;
  }
  return quote.change >= 0;
}

export function getQuoteColorClass(quote: MarketQuote): string {
  return isQuotePositive(quote)
    ? "text-[var(--positive)]"
    : "text-[var(--negative)]";
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatVolume(
  value: number | undefined,
  market?: DetectedMarket | MarketQuote["category"]
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (market === "tw") {
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  if (market === "hk") {
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  return formatCompactNumber(value);
}

export function formatMarketCap(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `$${formatCompactNumber(value)}`;
}

export function formatPeRatio(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function formatEarningsDate(ts: number | undefined, locale: string): string {
  if (ts == null || !Number.isFinite(ts)) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getFlashClass(
  quote: MarketQuote,
  previous: MarketQuote | undefined
): string {
  if (!previous || previous.price === quote.price) return "";
  const wentUp = quote.price > previous.price;
  const positive = quote.invertColors ? !wentUp : wentUp;
  return positive ? "quote-flash-up" : "quote-flash-down";
}

export function getPriceTickClass(
  quote: MarketQuote,
  previous: MarketQuote | undefined
): string {
  if (!previous || previous.price === quote.price) return "";
  const wentUp = quote.price > previous.price;
  const positive = quote.invertColors ? !wentUp : wentUp;
  return positive ? "ticker-price-tick-up" : "ticker-price-tick-down";
}

export function getDirectionArrow(quote: MarketQuote): string {
  if (quote.change > 0) return "▲";
  if (quote.change < 0) return "▼";
  return "—";
}
