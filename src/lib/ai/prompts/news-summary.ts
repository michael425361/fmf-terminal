import type { AISummaryLocale } from "../locale";
import type { NewsItem } from "../news-intelligence";

/**
 * News prompts (Phase 10). Locale-aware (EN/ZH). Output is strict JSON only —
 * no markdown, no prose, no code fences.
 */

const RANKING_SYSTEM_EN = `You are a financial news desk classifier for an institutional terminal.

For each numbered headline, assess it for the given ticker and return:
- relevanceScore: 0-100 (how directly the item concerns this specific company/asset)
- importance: 0-100 (market-moving weight: earnings, guidance, M&A, regulation, downgrades rank high; routine commentary ranks low)
- sentiment: "bullish" | "bearish" | "neutral" (likely directional read for the asset)

Output JSON only, no markdown, no prose, no code fences:
{ "ranked": [ { "index": number, "relevanceScore": number, "importance": number, "sentiment": "bullish"|"bearish"|"neutral" } ] }

Rules: include every index exactly once. Scores are integers. Sentiment enum is English only. No commentary outside JSON.`;

const RANKING_SYSTEM_ZH = `你是机构交易终端的财经新闻分类器。

针对给定标的，对每条带编号的新闻评估并返回：
- relevanceScore：0-100（该新闻与该公司/资产的直接相关程度）
- importance：0-100（影响市场的权重：财报、指引、并购、监管、评级调整权重高；日常评论权重低）
- sentiment："bullish" | "bearish" | "neutral"（对该标的可能的方向性解读）

仅输出 JSON，禁止 markdown、禁止散文、禁止代码围栏：
{ "ranked": [ { "index": number, "relevanceScore": number, "importance": number, "sentiment": "bullish"|"bearish"|"neutral" } ] }

规则：每个 index 必须且仅出现一次。分值为整数。sentiment 字段仍使用英文枚举。JSON 之外不得有任何内容。`;

const SUMMARY_SYSTEM_EN = `You are a Bloomberg/Reuters-style markets editor summarizing recent news flow for one asset.

Output JSON only, no markdown, no prose, no code fences:
{ "summary": string, "sentiment": "bullish"|"bearish"|"neutral", "themes": string[] }

summary: 2-4 neutral, analytical sentences synthesizing the most important items. No hype, no advice, no price targets, no invented facts.
themes: 2-4 short English tags in Title Case, 2-5 words each, no periods.
sentiment: net directional read across the flow (English enum only).`;

const SUMMARY_SYSTEM_ZH = `你是 Bloomberg/路透风格的财经编辑，为单一标的总结近期新闻流。

仅输出 JSON，禁止 markdown、禁止散文、禁止代码围栏：
{ "summary": string, "sentiment": "bullish"|"bearish"|"neutral", "themes": string[] }

summary：用 2-4 句中性、专业的简体中文综合最重要的新闻，不夸张、不建议、无目标价、不虚构。
themes：2-4 个简短中文标签，每个 4-12 个汉字，无句号。
sentiment：对整体新闻流的净方向解读（仍使用英文枚举）。`;

export function getNewsRankingSystemPrompt(locale: AISummaryLocale): string {
  return locale === "zh" ? RANKING_SYSTEM_ZH : RANKING_SYSTEM_EN;
}

export function getNewsSummarySystemPrompt(locale: AISummaryLocale): string {
  return locale === "zh" ? SUMMARY_SYSTEM_ZH : SUMMARY_SYSTEM_EN;
}

function serializeItems(items: NewsItem[]): Array<{
  index: number;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
}> {
  return items.map((item, index) => ({
    index,
    title: item.title,
    summary: item.summary?.slice(0, 400) ?? "",
    source: item.source,
    publishedAt: item.publishedAt,
  }));
}

export function buildNewsRankingUserPrompt(input: {
  ticker: string;
  items: NewsItem[];
  locale: AISummaryLocale;
}): string {
  return JSON.stringify({
    task: "rank_news",
    ticker: input.ticker,
    locale: input.locale,
    items: serializeItems(input.items),
  });
}

export function buildNewsSummaryUserPrompt(input: {
  ticker: string;
  items: NewsItem[];
  locale: AISummaryLocale;
}): string {
  return JSON.stringify({
    task: "summarize_news",
    ticker: input.ticker,
    outputLanguage: input.locale === "zh" ? "Simplified Chinese" : "English",
    locale: input.locale,
    items: serializeItems(input.items),
  });
}
