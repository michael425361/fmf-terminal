import type { RecentStoreState } from "./types";

const STORAGE_KEY = "fmf-command-palette-v1";
const MAX_ITEMS = 12;

const DEFAULT_STATE: RecentStoreState = {
  viewed: [],
  searched: [],
};

function read(): RecentStoreState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as RecentStoreState;
    return {
      viewed: Array.isArray(parsed.viewed) ? parsed.viewed : [],
      searched: Array.isArray(parsed.searched) ? parsed.searched : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function write(state: RecentStoreState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — ignore
  }
}

function pushUnique(list: string[], id: string): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, MAX_ITEMS);
}

export function loadRecentStore(): RecentStoreState {
  return read();
}

export function recordViewedAsset(id: string): RecentStoreState {
  const next = { ...read(), viewed: pushUnique(read().viewed, id) };
  write(next);
  return next;
}

export function recordSearchedAsset(id: string): RecentStoreState {
  const next = { ...read(), searched: pushUnique(read().searched, id) };
  write(next);
  return next;
}

export function getRecentIds(state: RecentStoreState): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...state.viewed, ...state.searched]) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}
