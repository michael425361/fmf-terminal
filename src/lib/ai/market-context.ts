import { calcMA20, calcMA50 } from "@/lib/chart/indicators";
import { calcRSI } from "@/lib/chart/rsi";
import type { OHLCVBar } from "@/lib/chart/types";
import type { MarketSummaryIndicators } from "./types";

const EPS = 1e-6;

export function slimCandles(bars: OHLCVBar[], maxBars = 60): OHLCVBar[] {
  if (bars.length <= maxBars) return bars;
  return bars.slice(-maxBars);
}

function avgVolume(bars: OHLCVBar[], period: number): number | null {
  if (bars.length < period) return null;
  const slice = bars.slice(-period);
  const sum = slice.reduce((a, b) => a + (b.volume || 0), 0);
  return sum / period;
}

export function buildIndicatorsFromCandles(
  bars: OHLCVBar[]
): MarketSummaryIndicators {
  if (bars.length < 2) {
    return {
      lastClose: bars[0]?.close ?? null,
      ma20: null,
      ma50: null,
      rsi14: null,
      priceVsMa20: null,
      volume: bars.at(-1)?.volume ?? null,
      avgVolume20: null,
      volumeVsAvg20: null,
    };
  }

  const last = bars[bars.length - 1];
  const ma20Series = calcMA20(bars);
  const ma50Series = calcMA50(bars);
  const rsiSeries = calcRSI(bars);

  const ma20 = ma20Series.at(-1)?.value ?? null;
  const ma50 = ma50Series.at(-1)?.value ?? null;
  const rsi14 = rsiSeries.at(-1)?.value ?? null;

  let priceVsMa20: MarketSummaryIndicators["priceVsMa20"] = null;
  if (ma20 != null) {
    const diff = (last.close - ma20) / ma20;
    if (Math.abs(diff) < 0.002) priceVsMa20 = "at";
    else priceVsMa20 = last.close > ma20 ? "above" : "below";
  }

  const avgVol20 = avgVolume(bars, 20);
  const vol = last.volume ?? 0;
  let volumeVsAvg20: MarketSummaryIndicators["volumeVsAvg20"] = null;
  if (avgVol20 != null && avgVol20 > 0) {
    const ratio = vol / avgVol20;
    if (ratio > 1.08) volumeVsAvg20 = "above";
    else if (ratio < 0.92) volumeVsAvg20 = "below";
    else volumeVsAvg20 = "inline";
  }

  return {
    lastClose: last.close,
    ma20,
    ma50,
    rsi14,
    priceVsMa20,
    volume: vol,
    avgVolume20: avgVol20,
    volumeVsAvg20,
  };
}
