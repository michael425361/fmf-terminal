import type { OHLCVBar } from "./types";

export type RejectReason =
  | "invalid-time"
  | "invalid-field"
  | "nan"
  | "negative-price"
  | "ohlc-inconsistent"
  | "duplicate-time"
  | "spike-high"
  | "spike-low"
  | "wick-anomaly"
  | "extreme-move"
  | "premarket-anomaly"
  | "incomplete";

export interface RejectedCandle {
  reason: RejectReason;
  message: string;
  bar: Partial<OHLCVBar>;
  time?: number;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidTimestamp(time: unknown): time is number {
  return isFiniteNumber(time) && time > 0;
}

/** Prices must be finite and strictly positive for equity-style charts. */
export function isValidPrice(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

export function isValidVolume(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

export function isOhlcConsistent(bar: OHLCVBar): boolean {
  const { open, high, low, close } = bar;
  const top = Math.max(open, close);
  const bottom = Math.min(open, close);
  return high >= top && high >= low && low <= bottom && low <= high;
}

/**
 * Clamp minor float drift into a valid OHLC envelope.
 * Returns null if the bar cannot be reconciled.
 */
export function reconcileOhlc(bar: OHLCVBar): OHLCVBar | null {
  const { open, close } = bar;
  let { high, low } = bar;

  const envelopeHigh = Math.max(open, high, low, close);
  const envelopeLow = Math.min(open, high, low, close);

  high = envelopeHigh;
  low = envelopeLow;

  const reconciled = { ...bar, high, low };
  return isOhlcConsistent(reconciled) ? reconciled : null;
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function neighborCloses(
  bars: OHLCVBar[],
  index: number,
  radius = 5
): number[] {
  const out: number[] = [];
  const start = Math.max(0, index - radius);
  const end = Math.min(bars.length - 1, index + radius);
  for (let i = start; i <= end; i++) {
    if (i !== index && isValidPrice(bars[i].close)) {
      out.push(bars[i].close);
    }
  }
  return out;
}

export function normalizeRawBar(raw: unknown): OHLCVBar | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const time = r.time;
  const open = r.open;
  const high = r.high;
  const low = r.low;
  const close = r.close;
  const volume = r.volume ?? 0;

  if (!isValidTimestamp(time)) return null;
  if (
    !isValidPrice(open) ||
    !isValidPrice(high) ||
    !isValidPrice(low) ||
    !isValidPrice(close)
  ) {
    return null;
  }
  if (!isValidVolume(volume)) return null;

  return {
    time,
    open,
    high,
    low,
    close,
    volume,
  };
}
