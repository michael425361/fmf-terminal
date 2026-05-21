import { createHash } from "crypto";
import type { NewsCategory, NormalizedNewsArticle } from "./types";
import type { RssFeedSource } from "./feeds";

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSummary(raw?: string): string {
  if (!raw) return "";
  const text = stripHtml(raw);
  if (text.length <= 280) return text;
  return `${text.slice(0, 277)}…`;
}

function parseDate(raw?: string): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function buildId(url: string, title: string): string {
  return createHash("sha256")
    .update(`${url}|${title}`)
    .digest("hex")
    .slice(0, 16);
}

export interface RawRssItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
}

export function normalizeRssItem(
  item: RawRssItem,
  feed: RssFeedSource
): NormalizedNewsArticle | null {
  const title = stripHtml(item.title ?? "");
  const url = (item.link ?? item.guid ?? "").trim();
  if (!title || !url) return null;

  const summary = toSummary(
    item.contentSnippet ?? item.summary ?? item.content
  );

  return {
    id: buildId(url, title),
    title,
    summary: summary || title,
    source: feed.name,
    category: feed.category,
    publishedAt: parseDate(item.isoDate ?? item.pubDate),
    url,
    tag: feed.tag,
  };
}

export function sortArticlesByDate(
  articles: NormalizedNewsArticle[]
): NormalizedNewsArticle[] {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function dedupeArticles(
  articles: NormalizedNewsArticle[]
): NormalizedNewsArticle[] {
  const seen = new Set<string>();
  const out: NormalizedNewsArticle[] = [];
  for (const a of articles) {
    const key = a.url || a.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}
