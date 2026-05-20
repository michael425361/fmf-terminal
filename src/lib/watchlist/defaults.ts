import type { WatchlistPersistedState } from "./types";
import { resolveCatalogEntry } from "./catalog";

const DEFAULT_SYMBOLS = [
  "SPY",
  "QQQ",
  "BTC-USD",
  "GC=F",
  "AMD",
  "NVDA",
  "TSLA",
  "399006.SZ",
];

export function createDefaultWatchlistState(): WatchlistPersistedState {
  const items = DEFAULT_SYMBOLS.map((sym, i) => {
    const entry = resolveCatalogEntry(sym);
    return {
      id: entry?.id ?? sym,
      pinned: i < 2,
    };
  }).filter((item) => item.id);

  return {
    version: 1,
    items,
    activeId: items[0]?.id ?? null,
  };
}
