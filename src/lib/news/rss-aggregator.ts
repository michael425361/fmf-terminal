import "server-only";

import Parser from "rss-parser";
import { getCachedNews, setCachedNews } from "./cache";
import { getFeedsForCategory, type RssFeedSource } from "./feeds";
import {
  dedupeArticles,
  normalizeRssItem,
  sortArticlesByDate,
  type RawRssItem,
} from "./normalize";
import { getNewsByCategory } from "./mock-news";
import type { NewsCategory, NewsFeedResponse, NormalizedNewsArticle } from "./types";

const parser = new Parser({
  timeout: 12_000,
  headers: {
    "User-Agent": "FMF-Terminal/1.0 (+https://www.fmfterminal.com)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

const FETCH_HEADERS = {
  "User-Agent": "FMF-Terminal/1.0 (+https://www.fmfterminal.com)",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

async function fetchFeed(
  feed: RssFeedSource
): Promise<{ articles: NormalizedNewsArticle[]; error?: string }> {
  try {
    const res = await fetch(feed.url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const xml = await res.text();
    const parsed = await parser.parseString(xml);
    const articles: NormalizedNewsArticle[] = [];

    for (const item of parsed.items ?? []) {
      const normalized = normalizeRssItem(item as RawRssItem, feed);
      if (normalized) articles.push(normalized);
    }

    return { articles };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feed unavailable";
    return { articles: [], error: `${feed.name}: ${message}` };
  }
}

function mockFallback(category: NewsCategory): NormalizedNewsArticle[] {
  return getNewsByCategory(category).map((m) => {
    const lang = "en";
    return {
      id: m.id,
      title: m.title[lang],
      summary: m.summary[lang],
      source: m.source[lang],
      category: m.category,
      publishedAt: new Date().toISOString(),
      url: "#",
      tag: m.tag?.[lang],
    };
  });
}

export async function aggregateNewsFeed(
  category: NewsCategory,
  options: { force?: boolean } = {}
): Promise<NewsFeedResponse> {
  const cacheKey = `news-${category}`;

  if (!options.force) {
    const cached = getCachedNews(cacheKey);
    if (cached && !cached.stale) return cached;
  }

  const feeds = getFeedsForCategory(category);
  const results = await Promise.allSettled(
    feeds.map((feed) => fetchFeed(feed))
  );

  const errors: string[] = [];
  let merged: NormalizedNewsArticle[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.error) errors.push(result.value.error);
      merged = merged.concat(result.value.articles);
    } else {
      errors.push(result.reason?.message ?? "Unknown feed error");
    }
  }

  merged = sortArticlesByDate(dedupeArticles(merged)).slice(0, 40);

  if (merged.length === 0) {
    merged = mockFallback(category);
    errors.push("Using offline fallback — live feeds temporarily unavailable");
  }

  const response: NewsFeedResponse = {
    category,
    articles: merged,
    fetchedAt: Date.now(),
    errors: errors.length > 0 ? errors : undefined,
  };

  setCachedNews(cacheKey, response);
  return response;
}
