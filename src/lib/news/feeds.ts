import type { NewsCategory } from "./types";

export interface RssFeedSource {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  tag?: string;
}

export const RSS_FEED_SOURCES: RssFeedSource[] = [
  {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/rss/topstories",
    category: "us",
    tag: "US",
  },
  {
    id: "cnbc-top",
    name: "CNBC",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    category: "us",
    tag: "US",
  },
  {
    id: "wallstreetcn",
    name: "华尔街见闻",
    url: "https://dedicated.wallstreetcn.com/rss.xml",
    category: "cn",
    tag: "A股",
  },
  {
    id: "wallstreetcn-rsshub",
    name: "华尔街见闻",
    url: "https://rsshub.app/wallstreetcn/global",
    category: "cn",
    tag: "A股",
  },
  {
    id: "reuters-business",
    name: "Reuters",
    url: "https://feeds.reuters.com/reuters/businessNews",
    category: "global",
    tag: "Global",
  },
  {
    id: "reuters-markets",
    name: "Reuters",
    url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
    category: "global",
    tag: "Global",
  },
];

export function getFeedsForCategory(category: NewsCategory): RssFeedSource[] {
  return RSS_FEED_SOURCES.filter((f) => f.category === category);
}
