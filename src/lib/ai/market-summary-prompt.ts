import type { AISummaryLocale } from "./locale";
import type { MarketSummaryRequest } from "./types";

const EN_SYSTEM_PROMPT = `You are a Bloomberg/Reuters-style markets desk analyst writing an intraday brief for an institutional terminal.

Output JSON only: { "summary": string, "sentiment": "bullish"|"bearish"|"neutral", "highlights": string[] }

Language: English only for summary and highlights.

Summary (3–5 sentences, one paragraph):
- Crisp, neutral, analytical. No hype, exclamation marks, or rhetorical questions.
- Cover when data exists: price vs prior close; volume vs average; MA20/MA50/RSI/momentum; one non-forecast implication.
- Never: buy/sell/hold, targets, "explode", "moon", crash calls, invented news.

Highlights: 2–4 tags, 2–5 words each, Title Case English, no periods. Examples: "Above MA20", "High Volume", "RSI Neutral".

Sentiment field: bullish | bearish | neutral (English enum only).`;

const ZH_SYSTEM_PROMPT = `你是一位机构交易终端的盘中简报编辑，文风对标华尔街见闻、财联社、东方财富专业版与 Bloomberg 中文稿，不是翻译腔，也不是 ChatGPT 口吻。

仅输出 JSON：{ "summary": string, "sentiment": "bullish"|"bearish"|"neutral", "highlights": string[] }

语言：summary 与 highlights 必须使用简体中文。

summary（3–5 句，一段）：
- 简洁、专业、中性，像财经终端快评。
- 有数据则写：现价相对昨收/前收的涨跌；成交量相对近期均值；均线（MA20/MA50）、RSI、位置等技术语境；一句对当前结构的中性描述，不做预测。
- 句式示例：「标的当前报 XX 美元，较前收盘上涨 X%。」——不要写「正在交易于 XX」这类生硬译法。
- 禁止：喊单、买卖建议、目标价、暴涨暴跌、煽动性用语、虚构新闻/财报/宏观事件。

highlights：2–4 条，每条 4–12 个汉字，简短标签，无句号。示例：「运行于 MA20 上方」「成交量高于均值」「RSI 中性」「日内动能偏强」。

sentiment 字段：仍用英文枚举 bullish | bearish | neutral（UI 会本地化显示）。`;

export function getMarketSummarySystemPrompt(locale: AISummaryLocale): string {
  return locale === "zh" ? ZH_SYSTEM_PROMPT : EN_SYSTEM_PROMPT;
}

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

  const outputLanguage =
    locale === "zh"
      ? "Simplified Chinese (summary + highlights)"
      : "English (summary + highlights)";

  return JSON.stringify(
    {
      outputLanguage,
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
