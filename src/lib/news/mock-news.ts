/** Offline fallback when RSS feeds are unavailable */

export type NewsCategory = "us" | "cn" | "global";

export interface MockNewsArticle {
  id: string;
  category: NewsCategory;
  title: { en: string; zh: string };
  source: { en: string; zh: string };
  summary: { en: string; zh: string };
  tag?: { en: string; zh: string };
}

const MOCK: MockNewsArticle[] = [
  {
    id: "us-fb-1",
    category: "us",
    title: {
      en: "US markets steady as traders await economic data",
      zh: "美国经济数据发布前，美股走势平稳",
    },
    source: { en: "FMF Wire", zh: "FMF 快讯" },
    summary: {
      en: "Index futures held narrow ranges ahead of key macro releases.",
      zh: "关键宏观数据发布前，指数期货窄幅波动。",
    },
    tag: { en: "Markets", zh: "市场" },
  },
  {
    id: "cn-fb-1",
    category: "cn",
    title: {
      en: "A-shares mixed with liquidity support in focus",
      zh: "A股分化震荡，流动性支持受关注",
    },
    source: { en: "FMF Wire", zh: "FMF 快讯" },
    summary: {
      en: "Growth and value sectors diverged amid policy expectations.",
      zh: "政策预期下成长与价值板块分化。",
    },
    tag: { en: "A-Share", zh: "A股" },
  },
  {
    id: "gl-fb-1",
    category: "global",
    title: {
      en: "Global assets track rates and dollar moves",
      zh: "全球资产跟随利率与美元波动",
    },
    source: { en: "FMF Wire", zh: "FMF 快讯" },
    summary: {
      en: "Cross-asset volatility remained elevated in overnight trade.",
      zh: "隔夜交易中跨资产波动率仍处高位。",
    },
    tag: { en: "Global", zh: "全球" },
  },
];

export function getNewsByCategory(category: NewsCategory): MockNewsArticle[] {
  return MOCK.filter((a) => a.category === category);
}
