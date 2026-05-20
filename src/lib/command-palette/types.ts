import type { AssetCatalogEntry } from "@/lib/watchlist/types";

export type CommandType =
  | "search"
  | "open"
  | "chart"
  | "switch"
  | "watchlist-add"
  | "watchlist-remove";

export interface ParsedCommand {
  type: CommandType;
  /** Raw argument after command verb */
  argument: string;
  /** Original user input */
  raw: string;
}

export interface SearchResultItem {
  entry: AssetCatalogEntry;
  score: number;
  displayName: string;
  exchange: string;
  /** Character ranges in display label to highlight [start, end] */
  highlights: Array<[number, number]>;
}

export interface RecentStoreState {
  viewed: string[];
  searched: string[];
}

export interface SearchEngineOptions {
  query: string;
  limit?: number;
  /** id → localized display name */
  localizedNames?: Record<string, string>;
  favoriteIds?: Set<string>;
  recentIds?: string[];
}
