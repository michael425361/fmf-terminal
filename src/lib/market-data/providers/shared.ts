import "server-only";

import type { OHLCVBar } from "@/lib/chart/types";
import type { YahooChartInterval } from "@/lib/chart/timeframes";

export const FETCH_TIMEOUT_MS = 12_000;
export const MAX_RETRIES = 2;

export async function withTimeout<T>(
  promise: Promise<T>,
  ms = FETCH_TIMEOUT_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Request timeout")),
      ms
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  label = "fetch"
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        console.warn(`[market-data:${label}] retry ${attempt + 1}/${retries}`);
      }
    }
  }
  throw lastErr;
}

export function quotesToBars(
  quotes: Array<{
    date?: Date | null;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    volume?: number | null;
  }>
): OHLCVBar[] {
  const bars: OHLCVBar[] = [];

  for (const q of quotes) {
    if (
      !q.date ||
      q.open == null ||
      q.high == null ||
      q.low == null ||
      q.close == null
    ) {
      continue;
    }

    const { open, high, low, close } = q;
    if (
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      open <= 0 ||
      high <= 0 ||
      low <= 0 ||
      close <= 0
    ) {
      continue;
    }

    bars.push({
      time: Math.floor(q.date.getTime() / 1000),
      open,
      high,
      low,
      close,
      volume: q.volume != null && Number.isFinite(q.volume) ? q.volume : 0,
    });
  }

  return bars;
}

export function mapIntervalToFinnhub(interval: YahooChartInterval): string {
  if (interval === "1d") return "D";
  if (interval === "1wk") return "W";
  if (interval === "1m") return "1";
  if (interval === "5m") return "5";
  if (interval === "15m") return "15";
  if (interval === "30m") return "30";
  if (interval === "1h" || interval === "60m") return "60";
  return "5";
}

export function mapIntervalToBinance(interval: YahooChartInterval): string {
  if (interval === "1m") return "1m";
  if (interval === "5m") return "5m";
  if (interval === "30m") return "30m";
  if (interval === "1h" || interval === "60m") return "1h";
  if (interval === "1d") return "1d";
  if (interval === "1wk") return "1w";
  return "5m";
}

export function mapIntervalToTwelveData(
  interval: YahooChartInterval
): string {
  if (interval === "1m") return "1min";
  if (interval === "5m") return "5min";
  if (interval === "15m") return "15min";
  if (interval === "30m") return "30min";
  if (interval === "1h" || interval === "60m") return "1h";
  if (interval === "1d") return "1day";
  if (interval === "1wk") return "1week";
  return "5min";
}

export function sortBars(bars: OHLCVBar[]): OHLCVBar[] {
  return [...bars].sort((a, b) => a.time - b.time);
}
