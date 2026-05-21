import type { OHLCVBar } from "./types";
import type { LinePoint } from "./indicators";

const RSI_PERIOD = 14;

/**
 * Wilder-smoothed RSI(14) for the lower indicator pane.
 */
export function calcRSI(bars: OHLCVBar[], period = RSI_PERIOD): LinePoint[] {
  if (bars.length < period + 1) return [];

  const out: LinePoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = bars[i].close - bars[i - 1].close;
    if (change >= 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const firstRsi = 100 - 100 / (1 + firstRs);
  out.push({ time: bars[period].time, value: firstRsi });

  for (let i = period + 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    out.push({ time: bars[i].time, value: rsi });
  }

  return out;
}

export const RSI_OVERBOUGHT = 70;
export const RSI_OVERSOLD = 30;
