import { getChinaAShareSearchAliases } from "@/lib/watchlist/china-a-shares";

/** Maps catalog id → extra search tokens (EN/ZH aliases, typos) */
const BASE_ASSET_SEARCH_ALIASES: Record<string, string[]> = {
  "us-gspc": ["spx", "s&p", "标普", "标普500"],
  "us-ixic": ["nasdaq", "ndx", "纳斯达克", "纳指"],
  "us-dji": ["dow", "djia", "道琼斯"],
  "us-vix": ["vix", "volatility", "恐慌指数"],
  "cn-shcomp": ["sse", "上证", "上证指数"],
  "cn-szcomp": ["szci", "深证", "深成指"],
  "cn-chinext": ["chinext", "创业板", "创业板指", "gem"],
  "hk-hsi": ["hsi", "hang seng", "恒生", "恒生指数"],
  "fx-dxy": ["dxy", "dollar index", "美元指数"],
  "fx-eurusd": ["eur", "欧元"],
  "fx-usdjpy": ["jpy", "yen", "日元"],
  "crypto-btc": ["btc", "bitcoin", "比特币"],
  "crypto-eth": ["eth", "ethereum", "以太坊"],
  "cmd-gold": ["gold", "xau", "黄金", "金价"],
  "cmd-silver": ["silver", "白银"],
  "cmd-wti": ["oil", "wti", "crude", "石油", "原油"],
  "cmd-brent": ["brent", "布伦特"],
  "cmd-wheat": ["wheat", "小麦", "zw"],
  "cmd-corn": ["corn", "玉米"],
  "cmd-soy": ["soy", "soybean", "大豆"],
  "cmd-copper": ["copper", "铜"],
  "cmd-ng": ["nat gas", "natural gas", "天然气"],
  "etf-spy": ["spy", "s&p etf"],
  "etf-qqq": ["qqq", "nasdaq etf", "纳指etf"],
  "us-amd": ["amd", "超微"],
  "us-nvda": ["nvda", "英伟达"],
  "us-tsla": ["tsla", "特斯拉"],
  "hk-0700": ["tencent", "腾讯", "0700"],
};

export const ASSET_SEARCH_ALIASES: Record<string, string[]> = {
  ...BASE_ASSET_SEARCH_ALIASES,
  ...getChinaAShareSearchAliases(),
};

/** Global alias → catalog id */
export const GLOBAL_QUERY_ALIASES: Record<string, string> = {
  gold: "cmd-gold",
  oil: "cmd-wti",
  wheat: "cmd-wheat",
  nasdaq: "us-ixic",
  spx: "us-gspc",
  btc: "crypto-btc",
  eth: "crypto-eth",
  黄金: "cmd-gold",
  石油: "cmd-wti",
  创业板: "cn-chinext",
  恒生: "hk-hsi",
  茅台: "cn-600519",
  贵州茅台: "cn-600519",
  比亚迪: "cn-002594",
  宁德时代: "cn-300750",
  中国平安: "cn-601318",
  创业板etf: "cn-159915",
  沪深300: "cn-510300",
};
