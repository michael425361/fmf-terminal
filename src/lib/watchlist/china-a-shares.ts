import type { AssetCatalogEntry } from "./types";

/** Raw A-share definition with Chinese name and pinyin abbreviation for search */
export interface ChinaAShareDef {
  code: string;
  exchange: "SS" | "SZ";
  nameEn: string;
  nameZh: string;
  /** Pinyin abbreviation, e.g. gzmt for 贵州茅台 */
  pinyin: string;
  /** Optional full pinyin string for partial matching */
  pinyinFull?: string;
  assetType?: AssetCatalogEntry["assetType"];
  extraAliases?: string[];
}

export const CHINA_A_SHARE_DEFS: ChinaAShareDef[] = [
  // —— Shanghai blue chips ——
  { code: "600519", exchange: "SS", nameEn: "Kweichow Moutai", nameZh: "贵州茅台", pinyin: "gzmt", pinyinFull: "guizhoumaotai", extraAliases: ["moutai", "茅台"] },
  { code: "600036", exchange: "SS", nameEn: "China Merchants Bank", nameZh: "招商银行", pinyin: "zsyh", pinyinFull: "zhaoshangyinhang" },
  { code: "601318", exchange: "SS", nameEn: "Ping An Insurance", nameZh: "中国平安", pinyin: "zgpa", pinyinFull: "zhongguopingan", extraAliases: ["pingan", "平安"] },
  { code: "600276", exchange: "SS", nameEn: "Hengrui Medicine", nameZh: "恒瑞医药", pinyin: "hryy", pinyinFull: "hengruiyiyao" },
  { code: "600030", exchange: "SS", nameEn: "CITIC Securities", nameZh: "中信证券", pinyin: "zxzq", pinyinFull: "zhongxinzhengquan" },
  { code: "601166", exchange: "SS", nameEn: "Industrial Bank", nameZh: "兴业银行", pinyin: "xyyh", pinyinFull: "xingyeyinhang" },
  { code: "600900", exchange: "SS", nameEn: "China Yangtze Power", nameZh: "长江电力", pinyin: "cjdl", pinyinFull: "changjiangdianli" },
  { code: "601012", exchange: "SS", nameEn: "LONGi Green Energy", nameZh: "隆基绿能", pinyin: "ljln", pinyinFull: "longjilvneng" },
  { code: "601888", exchange: "SS", nameEn: "China Tourism Group Duty Free", nameZh: "中国中免", pinyin: "zgzm", pinyinFull: "zhongguozhongmian" },
  { code: "600887", exchange: "SS", nameEn: "Inner Mongolia Yili", nameZh: "伊利股份", pinyin: "ylgf", pinyinFull: "yiligufen" },
  { code: "601398", exchange: "SS", nameEn: "ICBC", nameZh: "工商银行", pinyin: "gsyh", pinyinFull: "gongshangyinhang", extraAliases: ["icbc", "工行"] },
  { code: "601939", exchange: "SS", nameEn: "China Construction Bank", nameZh: "建设银行", pinyin: "jsyh", pinyinFull: "jiansheyinhang", extraAliases: ["ccb", "建行"] },
  { code: "601288", exchange: "SS", nameEn: "Agricultural Bank of China", nameZh: "农业银行", pinyin: "nyyh", pinyinFull: "nongyeyinhang", extraAliases: ["abc", "农行"] },
  { code: "600028", exchange: "SS", nameEn: "Sinopec", nameZh: "中国石化", pinyin: "zgsh", pinyinFull: "zhongguoshihua" },
  { code: "601857", exchange: "SS", nameEn: "PetroChina", nameZh: "中国石油", pinyin: "zgsy", pinyinFull: "zhongguoshiyou" },
  { code: "600809", exchange: "SS", nameEn: "Shanxi Xinghuacun Fen Wine", nameZh: "山西汾酒", pinyin: "sxfj", pinyinFull: "shanxifenjiu" },
  { code: "601988", exchange: "SS", nameEn: "Bank of China", nameZh: "中国银行", pinyin: "zgyh", pinyinFull: "zhongguoyinhang", extraAliases: ["boc", "中行"] },
  { code: "600050", exchange: "SS", nameEn: "China Unicom", nameZh: "中国联通", pinyin: "zglt", pinyinFull: "zhongguoliantong" },
  { code: "601628", exchange: "SS", nameEn: "China Life Insurance", nameZh: "中国人寿", pinyin: "zgrs", pinyinFull: "zhongguorenshou" },
  { code: "600690", exchange: "SS", nameEn: "Haier Smart Home", nameZh: "海尔智家", pinyin: "hezj", pinyinFull: "haierzhijia" },

  // —— Shenzhen / ChiNext ——
  { code: "000001", exchange: "SZ", nameEn: "Ping An Bank", nameZh: "平安银行", pinyin: "payh", pinyinFull: "pinganyinhang" },
  { code: "000002", exchange: "SZ", nameEn: "China Vanke", nameZh: "万科A", pinyin: "wka", pinyinFull: "wanke", extraAliases: ["vanke", "万科"] },
  { code: "000858", exchange: "SZ", nameEn: "Wuliangye Yibin", nameZh: "五粮液", pinyin: "wly", pinyinFull: "wuliangye" },
  { code: "002594", exchange: "SZ", nameEn: "BYD", nameZh: "比亚迪", pinyin: "byd", pinyinFull: "biyadi" },
  { code: "300750", exchange: "SZ", nameEn: "CATL", nameZh: "宁德时代", pinyin: "ndsd", pinyinFull: "ningdeshidai", extraAliases: ["catl", "宁德"] },
  { code: "300059", exchange: "SZ", nameEn: "East Money Information", nameZh: "东方财富", pinyin: "dfcf", pinyinFull: "dongfangcaifu" },
  { code: "000725", exchange: "SZ", nameEn: "BOE Technology", nameZh: "京东方A", pinyin: "jdfa", pinyinFull: "jingdongfang", extraAliases: ["boe", "京东方"] },
  { code: "002415", exchange: "SZ", nameEn: "Hikvision", nameZh: "海康威视", pinyin: "hkws", pinyinFull: "haikangweishi" },
  { code: "000333", exchange: "SZ", nameEn: "Midea Group", nameZh: "美的集团", pinyin: "mdjt", pinyinFull: "meidejituan", extraAliases: ["midea", "美的"] },
  { code: "002304", exchange: "SZ", nameEn: "Yanghe Brewery", nameZh: "洋河股份", pinyin: "yhgf", pinyinFull: "yanghegufen" },
  { code: "300124", exchange: "SZ", nameEn: "Shenzhen Inovance", nameZh: "汇川技术", pinyin: "hcjs", pinyinFull: "huichuanjishu" },
  { code: "002475", exchange: "SZ", nameEn: "Luxshare Precision", nameZh: "立讯精密", pinyin: "lxjm", pinyinFull: "lixunjingmi" },
  { code: "300014", exchange: "SZ", nameEn: "EVE Energy", nameZh: "亿纬锂能", pinyin: "ywln", pinyinFull: "yiweilneng" },
  { code: "000568", exchange: "SZ", nameEn: "Luzhou Laojiao", nameZh: "泸州老窖", pinyin: "lzlj", pinyinFull: "luzhoulaojiao" },
  { code: "002352", exchange: "SZ", nameEn: "SF Holding", nameZh: "顺丰控股", pinyin: "sfkg", pinyinFull: "shunfengkonggu", extraAliases: ["sf express", "顺丰"] },

  // —— STAR / ChiNext leaders ——
  { code: "688981", exchange: "SS", nameEn: "SMIC", nameZh: "中芯国际", pinyin: "zxgj", pinyinFull: "zhongxinguoji", extraAliases: ["smic", "中芯"] },
  { code: "688111", exchange: "SS", nameEn: "Kingsoft Office", nameZh: "金山办公", pinyin: "jsbg", pinyinFull: "jinshanbangong" },
  { code: "603259", exchange: "SS", nameEn: "WuXi AppTec", nameZh: "药明康德", pinyin: "ymkd", pinyinFull: "yaomingkangde" },
  { code: "688599", exchange: "SS", nameEn: "Trina Solar", nameZh: "天合光能", pinyin: "thgn", pinyinFull: "tianheguangneng" },

  // —— Onshore ETFs (Shanghai) ——
  { code: "510300", exchange: "SS", nameEn: "CSI 300 ETF", nameZh: "沪深300ETF", pinyin: "hs300", pinyinFull: "hushen300etf", assetType: "etf", extraAliases: ["csi300", "沪深300"] },
  { code: "510050", exchange: "SS", nameEn: "SSE 50 ETF", nameZh: "上证50ETF", pinyin: "sz50", pinyinFull: "shangzheng50etf", assetType: "etf", extraAliases: ["sse50", "上证50"] },
  { code: "510500", exchange: "SS", nameEn: "CSI 500 ETF", nameZh: "中证500ETF", pinyin: "zz500", pinyinFull: "zhongzheng500etf", assetType: "etf", extraAliases: ["csi500", "中证500"] },
  { code: "588000", exchange: "SS", nameEn: "STAR 50 ETF", nameZh: "科创50ETF", pinyin: "kc50", pinyinFull: "kechuang50etf", assetType: "etf", extraAliases: ["star50", "科创50"] },
  { code: "512880", exchange: "SS", nameEn: "Securities ETF", nameZh: "证券ETF", pinyin: "zqetf", pinyinFull: "zhengquanetf", assetType: "etf" },
  { code: "512690", exchange: "SS", nameEn: "Liquor ETF", nameZh: "酒ETF", pinyin: "jetf", pinyinFull: "jiuetf", assetType: "etf", extraAliases: ["白酒etf"] },

  // —— Onshore ETFs (Shenzhen) ——
  { code: "159915", exchange: "SZ", nameEn: "ChiNext ETF", nameZh: "创业板ETF", pinyin: "cybetf", pinyinFull: "chuangyebanetf", assetType: "etf", extraAliases: ["chinext etf", "创业板"] },
  { code: "159919", exchange: "SZ", nameEn: "CSI 300 ETF (SZ)", nameZh: "沪深300ETF", pinyin: "hs300sz", pinyinFull: "hushen300", assetType: "etf" },
  { code: "159949", exchange: "SZ", nameEn: "ChiNext 50 ETF", nameZh: "创业板50ETF", pinyin: "cyb50", pinyinFull: "chuangyeban50etf", assetType: "etf" },
  { code: "159601", exchange: "SZ", nameEn: "A50 ETF", nameZh: "A50ETF", pinyin: "a50etf", pinyinFull: "a50", assetType: "etf" },
];

export function chinaAShareToCatalogEntry(def: ChinaAShareDef): AssetCatalogEntry {
  const assetType = def.assetType ?? "cn_stock";
  const category = assetType === "etf" ? "etf" : "china";
  return {
    id: `cn-${def.code}`,
    symbol: `${def.code}.${def.exchange}`,
    shortLabel: def.code,
    name: def.nameEn,
    assetType,
    category,
    priceDecimals: 2,
  };
}

export const CHINA_A_SHARE_CATALOG: AssetCatalogEntry[] =
  CHINA_A_SHARE_DEFS.map(chinaAShareToCatalogEntry);

const defById = Object.fromEntries(
  CHINA_A_SHARE_DEFS.map((d) => [`cn-${d.code}`, d])
) as Record<string, ChinaAShareDef>;

export function getChinaAShareDef(id: string): ChinaAShareDef | undefined {
  return defById[id];
}

/** Search tokens per catalog id (Chinese name, code, pinyin) */
export function getChinaAShareSearchAliases(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const def of CHINA_A_SHARE_DEFS) {
    const id = `cn-${def.code}`;
    out[id] = [
      def.code,
      def.nameZh,
      def.pinyin,
      def.pinyinFull ?? "",
      def.nameEn,
      `${def.code}.${def.exchange}`,
      ...(def.extraAliases ?? []),
    ].filter(Boolean);
  }
  return out;
}
