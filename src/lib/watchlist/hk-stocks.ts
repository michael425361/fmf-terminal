import type { AssetCatalogEntry } from "./types";

export interface HKStockDef {
  code: string;
  nameEn: string;
  nameZh: string;
  pinyin?: string;
  extraAliases?: string[];
}

export const HK_STOCK_DEFS: HKStockDef[] = [
  { code: "0700", nameEn: "Tencent Holdings", nameZh: "腾讯", pinyin: "tengxun", extraAliases: ["tencent", "腾讯控股"] },
  { code: "9988", nameEn: "Alibaba Group (HK)", nameZh: "阿里巴巴", pinyin: "alibaba", extraAliases: ["alibaba", "阿里港股", "阿里"] },
  { code: "3690", nameEn: "Meituan", nameZh: "美团", pinyin: "meituan", extraAliases: ["meituan", "美团-W"] },
  { code: "1810", nameEn: "Xiaomi Corporation", nameZh: "小米集团", pinyin: "xiaomi", extraAliases: ["xiaomi", "小米"] },
  { code: "1211", nameEn: "BYD Company (HK)", nameZh: "比亚迪股份", pinyin: "biyadi", extraAliases: ["byd", "比亚迪港股", "比亚迪"] },
  { code: "1299", nameEn: "AIA Group", nameZh: "友邦保险", pinyin: "youbang", extraAliases: ["aia", "友邦"] },
  { code: "0005", nameEn: "HSBC Holdings", nameZh: "汇丰控股", pinyin: "huifeng", extraAliases: ["hsbc", "汇丰"] },
  { code: "0941", nameEn: "China Mobile", nameZh: "中国移动", pinyin: "yidong", extraAliases: ["china mobile", "中移动"] },
  { code: "0981", nameEn: "SMIC (HK)", nameZh: "中芯国际", pinyin: "zhongxin", extraAliases: ["smic", "中芯"] },
  { code: "0388", nameEn: "Hong Kong Exchanges", nameZh: "香港交易所", pinyin: "hkex", extraAliases: ["hkex", "港交所"] },
  { code: "9961", nameEn: "Trip.com Group (HK)", nameZh: "携程集团", pinyin: "xiecheng", extraAliases: ["trip.com", "携程", "ctrip"] },
  { code: "9618", nameEn: "JD.com (HK)", nameZh: "京东集团", pinyin: "jingdong", extraAliases: ["jd", "京东", "jd.com"] },
  { code: "9999", nameEn: "NetEase (HK)", nameZh: "网易", pinyin: "wangyi", extraAliases: ["netease", "网易-S"] },
  { code: "1024", nameEn: "Kuaishou Technology", nameZh: "快手", pinyin: "kuaishou", extraAliases: ["kuaishou", "快手-W"] },
  { code: "9888", nameEn: "Baidu (HK)", nameZh: "百度集团", pinyin: "baidu", extraAliases: ["baidu", "百度", "百度-SW"] },
];

export function hkStockToCatalogEntry(def: HKStockDef): AssetCatalogEntry {
  return {
    id: `hk-${def.code}`,
    symbol: `${def.code}.HK`,
    shortLabel: def.code,
    name: def.nameEn,
    assetType: "hk_stock",
    category: "hk",
    priceDecimals: 2,
  };
}

export const HK_STOCK_CATALOG: AssetCatalogEntry[] =
  HK_STOCK_DEFS.map(hkStockToCatalogEntry);

const defById = Object.fromEntries(
  HK_STOCK_DEFS.map((d) => [`hk-${d.code}`, d])
) as Record<string, HKStockDef>;

export function getHKStockDef(id: string): HKStockDef | undefined {
  return defById[id];
}

export function getHKStockSearchAliases(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const def of HK_STOCK_DEFS) {
    const id = `hk-${def.code}`;
    out[id] = [
      def.code,
      def.nameZh,
      def.nameEn,
      def.pinyin ?? "",
      `${def.code}.HK`,
      `${def.code}.hk`,
      ...(def.extraAliases ?? []),
    ].filter(Boolean);
  }
  return out;
}
