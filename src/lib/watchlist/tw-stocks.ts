import type { AssetCatalogEntry } from "./types";

export interface TWStockDef {
  code: string;
  nameEn: string;
  nameZh: string;
  pinyin?: string;
  extraAliases?: string[];
}

export const TW_STOCK_DEFS: TWStockDef[] = [
  { code: "2330", nameEn: "Taiwan Semiconductor (TSMC)", nameZh: "台积电", pinyin: "taidian", extraAliases: ["tsmc", "台积电", "台積電"] },
  { code: "2317", nameEn: "Hon Hai Precision (Foxconn)", nameZh: "鸿海精密", pinyin: "honghai", extraAliases: ["foxconn", "鸿海", "富士康"] },
  { code: "2454", nameEn: "MediaTek", nameZh: "联发科", pinyin: "lianfake", extraAliases: ["mediatek", "联发科", "聯發科"] },
  { code: "2308", nameEn: "Delta Electronics", nameZh: "台达电", pinyin: "taida", extraAliases: ["delta", "台达", "台達電"] },
  { code: "2382", nameEn: "Quanta Computer", nameZh: "广达电脑", pinyin: "guangda", extraAliases: ["quanta", "广达", "廣達"] },
  { code: "2357", nameEn: "ASUSTeK Computer", nameZh: "华硕", pinyin: "huashuo", extraAliases: ["asus", "华硕", "華碩"] },
  { code: "2353", nameEn: "Acer Inc.", nameZh: "宏碁", pinyin: "hongqi", extraAliases: ["acer", "宏碁"] },
  { code: "2882", nameEn: "Cathay Financial Holding", nameZh: "国泰金控", pinyin: "guotai", extraAliases: ["cathay", "国泰", "國泰金"] },
  { code: "2881", nameEn: "Fubon Financial Holding", nameZh: "富邦金控", pinyin: "fubang", extraAliases: ["fubon", "富邦", "富邦金"] },
  { code: "2885", nameEn: "Yuanta Financial Holding", nameZh: "元大金控", pinyin: "yuanda", extraAliases: ["yuanta", "元大", "元大金"] },
];

export function twStockToCatalogEntry(def: TWStockDef): AssetCatalogEntry {
  return {
    id: `tw-${def.code}`,
    symbol: `${def.code}.TW`,
    shortLabel: def.code,
    name: def.nameEn,
    assetType: "tw_stock",
    category: "tw",
    priceDecimals: 2,
  };
}

export const TW_STOCK_CATALOG: AssetCatalogEntry[] =
  TW_STOCK_DEFS.map(twStockToCatalogEntry);

const defById = Object.fromEntries(
  TW_STOCK_DEFS.map((d) => [`tw-${d.code}`, d])
) as Record<string, TWStockDef>;

export function getTWStockDef(id: string): TWStockDef | undefined {
  return defById[id];
}

export function getTWStockSearchAliases(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const def of TW_STOCK_DEFS) {
    const id = `tw-${def.code}`;
    out[id] = [
      def.code,
      def.nameZh,
      def.nameEn,
      def.pinyin ?? "",
      `${def.code}.TW`,
      `${def.code}.tw`,
      ...(def.extraAliases ?? []),
    ].filter(Boolean);
  }
  return out;
}
