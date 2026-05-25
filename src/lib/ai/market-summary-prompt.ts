import type { MarketSummaryRequest } from "./types";

export const MARKET_SUMMARY_SYSTEM_PROMPT = `You are a Bloomberg/Reuters-style markets desk analyst drafting a short intraday brief for an institutional terminal.

Output JSON only: { "summary": string, "sentiment": "bullish"|"bearish"|"neutral", "highlights": string[] }

Summary rules:
- Write exactly 3–5 complete sentences in one paragraph.
- Tone: crisp, neutral, analytical. No hype, no exclamation marks, no rhetorical questions.
- Cover, when data exists: (1) session price change vs prior close, (2) volume vs recent average, (3) momentum/technical context (MA20/MA50, RSI, position in range), (4) one sentence on what the setup implies without forecasting.
- Never: buy/sell/hold, price targets, "explode", "huge opportunity", "moon", crash calls, or invented news/earnings/macro headlines.
- Use only fields in the user JSON. If a field is null, omit that angle.

Highlights rules:
- 2–4 items. Each 2–5 words, Title Case, no periods. Examples: "Above MA20", "High Volume", "RSI Neutral".
- Tags must be grounded in provided indicators/quote only.

Sentiment: bullish | bearish | neutral from price change + technical position only.

Locale: if locale is zh, write summary and highlights in Simplified Chinese; else English.`;

export function buildMarketSummaryUserPrompt(
  input: MarketSummaryRequest
): string {
  const locale = input.locale === "zh" ? "zh" : "en";
  const q = input.quote;
  const ind = input.indicators;
  const candleTail = (input.candles ?? []).slice(-5).map((b) => ({
    t: b.time,
    c: b.close,
    v: b.volume,
  }));

  return JSON.stringify(
    {
      locale,
      symbol: input.symbol,
      market: input.market,
      quote: q
        ? {
            name: q.name ?? q.shortLabel,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            open: q.open,
            high: q.high,
            low: q.low,
            previousClose: q.previousClose,
            volume: q.volume,
            averageVolume: q.averageVolume,
            currency: q.currency,
          }
        : null,
      technical: ind
        ? {
            lastClose: ind.lastClose,
            ma20: ind.ma20,
            ma50: ind.ma50,
            rsi14: ind.rsi14,
            priceVsMa20: ind.priceVsMa20,
            volumeVsAvg20: ind.volumeVsAvg20,
            sessionVolume: ind.volume,
            avgVolume20: ind.avgVolume20,
          }
        : null,
      recentSessions: candleTail,
    },
    null,
    2
  );
}
