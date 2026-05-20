import { createDefaultWatchlistState } from "./defaults";
import type { WatchlistPersistedState } from "./types";

const STORAGE_KEY = "fmf-watchlist-v1";

export function loadWatchlistState(): WatchlistPersistedState {
  if (typeof window === "undefined") {
    return createDefaultWatchlistState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultWatchlistState();

    const parsed = JSON.parse(raw) as WatchlistPersistedState;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return createDefaultWatchlistState();
    }

    return {
      version: 1,
      items: parsed.items,
      activeId: parsed.activeId ?? parsed.items[0]?.id ?? null,
    };
  } catch {
    return createDefaultWatchlistState();
  }
}

export function saveWatchlistState(state: WatchlistPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota or private mode
  }
}
