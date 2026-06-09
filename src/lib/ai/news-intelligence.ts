import type { AISummaryLocale } from "./locale";
import { generateAIResponse, parseAIJson } from "./model-router";
import { clamp0to100, parseSentiment } from "./parse-utils";
import {
  buildNewsRankingUserPrompt,
  buildNewsSummaryUserPrompt,
  getNewsRankingSystemPrompt,
  getNewsSummarySystemPrompt,
} from "./prompts/news-summary";
import {
  fetchFinnhubCompanyNews,
  fetchFinnhubMarketNews,
  type FinnhubMarketCategory,
  type FinnhubNewsArticle,
} from "@/lib/data/finnhub";

/**
 * News Intelligence Engine (Phase 1).
 *
 * Fetches company/market news, classifies sentiment + scores importance and
 * relevance via the model router, and returns the top-ranked items plus an
 * editorial summary.
 */

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
}

export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface RankedNews {
  relevanceScore: number;
  importance: number;
  sentiment: NewsSentiment;
}

const clampScore = clamp0to100;

export interface RankedNewsItem extends NewsItem, RankedNews {
  /** Composite ranking score = importance × relevance (0-100). */
  score: number;
}

export interface NewsSummary {
  summary: string;
  sentiment: NewsSentiment;
  themes: string[];
}

function articleToNewsItem(article: FinnhubNewsArticle): NewsItem {
  return {
    title: (article.headline ?? "").trim(),
    summary: (article.summary ?? "").trim(),
    source: (article.source ?? "").trim(),
    publishedAt: article.datetime
      ? new Date(article.datetime * 1000).toISOString()
      : new Date().toISOString(),
    url: article.url ?? "",
  };
}

function dedupeByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase().slice(0, 80);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Company-specific news, most recent first, de-duplicated. */
export async function getCompanyNews(
  ticker: string,
  options: { days?: number; limit?: number } = {}
): Promise<NewsItem[]> {
  const { days = 14, limit = 30 } = options;
  const articles = await fetchFinnhubCompanyNews(ticker, days);
  const items = dedupeByTitle(articles.map(articleToNewsItem)).filter(
    (i) => i.title
  );
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items.slice(0, limit);
}

/** Broad market news for a category. */
export async function getMarketNews(
  category: FinnhubMarketCategory = "general",
  options: { limit?: number } = {}
): Promise<NewsItem[]> {
  const { limit = 30 } = options;
  const articles = await fetchFinnhubMarketNews(category);
  const items = dedupeByTitle(articles.map(articleToNewsItem)).filter(
    (i) => i.title
  );
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items.slice(0, limit);
}

interface RawRanking {
  index: number;
  relevanceScore: number;
  importance: number;
  sentiment: string;
}

/**
 * Merge model rankings onto news items and compute the composite score.
 * Exported for unit testing of the ranking math.
 */
export function applyRankings(
  items: NewsItem[],
  rankings: RawRanking[]
): RankedNewsItem[] {
  const byIndex = new Map<number, RawRanking>();
  for (const r of rankings) {
    if (typeof r?.index === "number") byIndex.set(r.index, r);
  }

  const ranked: RankedNewsItem[] = items.map((item, index) => {
    const r = byIndex.get(index);
    const relevanceScore = clampScore(r?.relevanceScore);
    const importance = clampScore(r?.importance);
    return {
      ...item,
      relevanceScore,
      importance,
      sentiment: parseSentiment(r?.sentiment),
      score: Math.round((relevanceScore * importance) / 100),
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Classify + score news with the model router and return the top items by
 * composite score (importance × relevance). Falls back to recency order when
 * the model is unavailable so the UI always has content.
 */
export async function rankNews(
  items: NewsItem[],
  options: { ticker: string; locale?: AISummaryLocale; limit?: number }
): Promise<RankedNewsItem[]> {
  const { ticker, locale = "en", limit = 8 } = options;
  if (items.length === 0) return [];

  const candidate = items.slice(0, 25);

  try {
    const { content } = await generateAIResponse({
      task: "news-ranking",
      system: getNewsRankingSystemPrompt(locale),
      user: buildNewsRankingUserPrompt({ ticker, items: candidate, locale }),
      maxTokens: 1400,
      temperature: 0,
    });

    const parsed = parseAIJson<{ ranked?: RawRanking[] }>(content);
    if (parsed?.ranked && Array.isArray(parsed.ranked)) {
      return applyRankings(candidate, parsed.ranked).slice(0, limit);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[news-intelligence] rankNews failed, using recency fallback:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Fallback: neutral sentiment, recency-ordered.
  return candidate.slice(0, limit).map((item) => ({
    ...item,
    relevanceScore: 50,
    importance: 50,
    sentiment: "neutral" as const,
    score: 25,
  }));
}

/** Editorial summary of the supplied news flow. */
export async function summarizeNews(
  items: NewsItem[],
  options: { ticker: string; locale?: AISummaryLocale }
): Promise<NewsSummary> {
  const { ticker, locale = "en" } = options;
  if (items.length === 0) {
    return { summary: "", sentiment: "neutral", themes: [] };
  }

  const { content } = await generateAIResponse({
    task: "news-summary",
    system: getNewsSummarySystemPrompt(locale),
    user: buildNewsSummaryUserPrompt({
      ticker,
      items: items.slice(0, 12),
      locale,
    }),
    maxTokens: 700,
    temperature: 0.2,
  });

  const parsed = parseAIJson<{
    summary?: string;
    sentiment?: string;
    themes?: unknown;
  }>(content);

  if (!parsed?.summary) {
    throw new Error("News summary parse failed");
  }

  const themes = Array.isArray(parsed.themes)
    ? parsed.themes
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return {
    summary: parsed.summary.trim(),
    sentiment: parseSentiment(parsed.sentiment),
    themes,
  };
}
