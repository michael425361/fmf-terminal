export type NewsCategory = "us" | "cn" | "global";

export interface NormalizedNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  url: string;
  tag?: string;
}

export interface NewsFeedResponse {
  category: NewsCategory;
  articles: NormalizedNewsArticle[];
  fetchedAt: number;
  stale?: boolean;
  errors?: string[];
}
