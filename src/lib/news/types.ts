export type NewsCategory = "us" | "cn" | "global";

export interface NewsArticle {
  id: string;
  category: NewsCategory;
  title: { en: string; zh: string };
  source: { en: string; zh: string };
  time: string;
  summary: { en: string; zh: string };
  tag?: { en: string; zh: string };
}
