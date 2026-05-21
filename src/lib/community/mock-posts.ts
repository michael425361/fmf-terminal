import type { CommunityCategory, CommunityPost } from "./types";

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600_000).toISOString();

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "us-1",
    category: "us",
    username: "TechFlow_US",
    avatarInitials: "TF",
    avatarHue: 38,
    publishedAt: hoursAgo(0.5),
    title: {
      en: "NVDA holding above $900 — is the AI trade overcrowded?",
      zh: "英伟达站稳900美元上方——AI交易是否过度拥挤？",
    },
    content: {
      en: "Semis led again today but breadth narrowed. Watching hyperscaler capex guides and options skew into earnings.",
      zh: "半导体再度领涨，但市场广度收窄。关注云巨头资本开支指引与财报前期权偏斜。",
    },
    tags: ["NVDA", "AMD", "SOXX"],
    likes: 284,
    comments: 47,
    views: 3200,
  },
  {
    id: "us-2",
    category: "us",
    username: "MacroDesk",
    avatarInitials: "MD",
    avatarHue: 210,
    publishedAt: hoursAgo(2),
    title: {
      en: "Fed speakers lean patient — yields dip, growth trades bounce",
      zh: "美联储官员偏耐心——收益率回落，成长板块反弹",
    },
    content: {
      en: "Soft landing narrative back in play. Long duration tech vs short small-caps pair still my base case.",
      zh: "软着陆叙事回归。长久期科技做空小盘仍是我的基础策略。",
    },
    tags: ["TLT", "QQQ", "IWM"],
    likes: 156,
    comments: 31,
    views: 1890,
  },
  {
    id: "us-3",
    category: "us",
    username: "OptionsHawk",
    avatarInitials: "OH",
    avatarHue: 12,
    publishedAt: hoursAgo(5),
    title: {
      en: "TSLA weekly call spreads into delivery data",
      zh: "特斯拉交付数据前布局周度看涨价差",
    },
    content: {
      en: "Implied vol cheap vs realized. Defined risk structure if we break $180 resistance.",
      zh: "隐含波动率相对已实现偏低。若突破180美元阻力，用有限风险结构参与。",
    },
    tags: ["TSLA"],
    likes: 92,
    comments: 18,
    views: 1104,
  },
  {
    id: "us-4",
    category: "us",
    username: "ValueLane",
    avatarInitials: "VL",
    avatarHue: 145,
    publishedAt: hoursAgo(8),
    title: {
      en: "Berkshire trim rumors — what it means for mega-cap quality",
      zh: "传伯克希尔减持——对超大盘质量股意味着什么",
    },
    content: {
      en: "Not panicking. Quality factor still works if rates stay range-bound. Adding on weakness selectively.",
      zh: "不必恐慌。利率区间震荡时质量因子仍有效，选择性逢低布局。",
    },
    tags: ["BRK.B", "AAPL", "KO"],
    likes: 67,
    comments: 12,
    views: 876,
  },
  {
    id: "cn-1",
    category: "cn",
    username: "北向观察员",
    avatarInitials: "北",
    avatarHue: 28,
    publishedAt: hoursAgo(1),
    title: {
      en: "Northbound flows turn positive — ChiNext leads",
      zh: "北向资金转正，创业板指领涨",
    },
    content: {
      en: "Liquidity support expectations lifting growth beta. Watching 300750 and liquor names for persistence.",
      zh: "流动性支持预期推升成长贝塔。关注宁德时代与白酒板块持续性。",
    },
    tags: ["300750", "399006", "600519"],
    likes: 412,
    comments: 86,
    views: 5400,
  },
  {
    id: "cn-2",
    category: "cn",
    username: "龙头研究员",
    avatarInitials: "龙",
    avatarHue: 350,
    publishedAt: hoursAgo(3),
    title: {
      en: "PBOC MLF steady — banks and insurers outperform",
      zh: "央行MLF利率持平，银行保险板块走强",
    },
    content: {
      en: "Policy tone balanced. Prefer high-dividend SOEs near term, keep new-energy on watchlist only.",
      zh: "政策基调偏稳。短期偏好高股息央企，新能源仅观察。",
    },
    tags: ["601318", "601398", "510300"],
    likes: 198,
    comments: 44,
    views: 2900,
  },
  {
    id: "cn-3",
    category: "cn",
    username: "短线客老K",
    avatarInitials: "K",
    avatarHue: 200,
    publishedAt: hoursAgo(6),
    title: {
      en: "Limit-up board thinning — time to reduce chase risk",
      zh: "涨停家数减少——该降低追涨风险了",
    },
    content: {
      en: "Emotion cooling after hot theme rotation. Focus on leaders with volume confirmation only.",
      zh: "热门题材轮动后情绪降温，只做有量能确认的龙头。",
    },
    tags: ["002594", "688981"],
    likes: 133,
    comments: 52,
    views: 2100,
  },
  {
    id: "cn-4",
    category: "cn",
    username: "宏观小札",
    avatarInitials: "札",
    avatarHue: 170,
    publishedAt: hoursAgo(12),
    title: {
      en: "Offshore CNH steady — exporters breathe easier",
      zh: "离岸人民币企稳——出口链喘口气",
    },
    content: {
      en: "FX stability helps risk appetite for HK tech ADRs. Still sizing positions conservatively.",
      zh: "汇率稳定利好港股科技ADR风险偏好，仓位仍保守。",
    },
    tags: ["USDCNH", "0700.HK"],
    likes: 88,
    comments: 19,
    views: 1450,
  },
  {
    id: "daily-1",
    category: "daily",
    username: "FMF_Trader",
    avatarInitials: "FM",
    avatarHue: 42,
    publishedAt: hoursAgo(0.25),
    title: {
      en: "Morning routine: coffee, levels, and no revenge trades",
      zh: "晨间习惯：咖啡、关键位、绝不报复性交易",
    },
    content: {
      en: "Best days start with a plan and end with discipline. What's your pre-market checklist?",
      zh: "好的交易日从计划开始，以纪律结束。你的盘前清单是什么？",
    },
    likes: 521,
    comments: 124,
    views: 6800,
  },
  {
    id: "daily-2",
    category: "daily",
    username: "RiskFirst",
    avatarInitials: "RF",
    avatarHue: 280,
    publishedAt: hoursAgo(4),
    title: {
      en: "Journal entry: stopped out twice, still green on the week",
      zh: "交易日记：止损两次，本周仍盈利",
    },
    content: {
      en: "Process > outcome. Small losses preserved capital for the third setup that worked.",
      zh: "过程大于结果。小亏保住本金，第三次机会才真正赚到。",
    },
    likes: 245,
    comments: 67,
    views: 3100,
  },
  {
    id: "daily-3",
    category: "daily",
    username: "QuantCoffee",
    avatarInitials: "QC",
    avatarHue: 55,
    publishedAt: hoursAgo(9),
    title: {
      en: "Backtesting vs live trading — the gap nobody talks about",
      zh: "回测与实盘——少有人谈及的落差",
    },
    content: {
      en: "Slippage, halts, and psychology eat backtests for breakfast. Paper trade longer than you want.",
      zh: "滑点、停牌和心态会吞噬回测优势。模拟盘时间要长于你的耐心。",
    },
    likes: 178,
    comments: 41,
    views: 2400,
  },
  {
    id: "daily-4",
    category: "daily",
    username: "WeekendMacro",
    avatarInitials: "WM",
    avatarHue: 320,
    publishedAt: hoursAgo(18),
    title: {
      en: "Reading list: rates, liquidity, and second-order effects",
      zh: "阅读清单：利率、流动性与二阶效应",
    },
    content: {
      en: "Sharing three essays that changed how I think about positioning into macro weeks.",
      zh: "分享三篇改变我宏观周仓位思路的文章。",
    },
    likes: 94,
    comments: 22,
    views: 1200,
  },
];

export function getPostsByCategory(
  category: CommunityCategory
): CommunityPost[] {
  return MOCK_COMMUNITY_POSTS.filter((p) => p.category === category).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
