import type { MarketCategory } from "@/lib/market-data/types";

export type AssetType =
  | "us_stock"
  | "cn_stock"
  | "hk_stock"
  | "etf"
  | "index"
  | "forex"
  | "crypto"
  | "commodity";

export interface AssetCatalogEntry {
  id: string;
  symbol: string;
  shortLabel: string;
  name: string;
  assetType: AssetType;
  category: MarketCategory | "etf";
  invertColors?: boolean;
  priceDecimals?: number;
}

export interface WatchlistStoredItem {
  id: string;
  pinned?: boolean;
}

export interface WatchlistPersistedState {
  version: 1;
  items: WatchlistStoredItem[];
  activeId: string | null;
}

export interface WatchlistItemView extends AssetCatalogEntry {
  pinned: boolean;
  order: number;
}
