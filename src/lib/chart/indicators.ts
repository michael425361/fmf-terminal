import type { OHLCVBar } from "./types";

export interface LinePoint {
  time: number;
  value: number;
}

export function calcSMA(bars: OHLCVBar[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += bars[j].close;
    }
    out.push({ time: bars[i].time, value: sum / period });
  }
  return out;
}

export function calcVWAP(bars: OHLCVBar[]): LinePoint[] {
  let cumPV = 0;
  let cumV = 0;
  return bars.map((b) => {
    const tp = (b.high + b.low + b.close) / 3;
    cumPV += tp * (b.volume || 0);
    cumV += b.volume || 0;
    const value = cumV > 0 ? cumPV / cumV : b.close;
    return { time: b.time, value };
  });
}

export function calcMA20(bars: OHLCVBar[]) {
  return calcSMA(bars, 20);
}

export function calcMA50(bars: OHLCVBar[]) {
  return calcSMA(bars, 50);
}
