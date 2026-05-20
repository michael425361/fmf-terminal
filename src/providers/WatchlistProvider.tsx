"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CATALOG_BY_ID } from "@/lib/watchlist/catalog";
import { createDefaultWatchlistState } from "@/lib/watchlist/defaults";
import { loadWatchlistState, saveWatchlistState } from "@/lib/watchlist/storage";
import type {
  WatchlistItemView,
  WatchlistPersistedState,
  WatchlistStoredItem,
} from "@/lib/watchlist/types";
import { useMarketData } from "./MarketDataProvider";

interface WatchlistContextValue {
  items: WatchlistItemView[];
  activeId: string | null;
  activeItem: WatchlistItemView | null;
  isFavorite: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  setActive: (id: string) => void;
  togglePin: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  hydrated: boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function sortItems(stored: WatchlistStoredItem[]): WatchlistStoredItem[] {
  const pinned = stored.filter((i) => i.pinned);
  const rest = stored.filter((i) => !i.pinned);
  return [...pinned, ...rest];
}

function toViewItems(stored: WatchlistStoredItem[]): WatchlistItemView[] {
  return sortItems(stored)
    .map((item, order) => {
      const entry = CATALOG_BY_ID[item.id];
      if (!entry) return null;
      return { ...entry, pinned: Boolean(item.pinned), order };
    })
    .filter((x): x is WatchlistItemView => x !== null);
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { setChartSymbol, loadWatchlistMarketData } = useMarketData();
  const [persisted, setPersisted] = useState<WatchlistPersistedState>(
    createDefaultWatchlistState
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPersisted(loadWatchlistState());
    setHydrated(true);
  }, []);

  const items = useMemo(() => toViewItems(persisted.items), [persisted.items]);

  const activeItem = useMemo((): WatchlistItemView | null => {
    const id = persisted.activeId;
    if (id) {
      const fromList = items.find((i) => i.id === id);
      if (fromList) return fromList;
      const fromCatalog = CATALOG_BY_ID[id];
      if (fromCatalog) {
        const pinned = persisted.items.find((i) => i.id === id)?.pinned ?? false;
        return { ...fromCatalog, pinned, order: -1 };
      }
    }
    return items[0] ?? null;
  }, [items, persisted.activeId, persisted.items]);

  const persist = useCallback((next: WatchlistPersistedState) => {
    setPersisted(next);
    saveWatchlistState(next);
  }, []);

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  useEffect(() => {
    if (!hydrated || ids.length === 0) return;
    loadWatchlistMarketData(ids);
  }, [hydrated, ids, loadWatchlistMarketData]);

  useEffect(() => {
    if (!hydrated || !activeItem) return;
    setChartSymbol(activeItem.symbol);
  }, [hydrated, activeItem?.id, activeItem?.symbol, setChartSymbol]);

  const setActive = useCallback(
    (id: string) => {
      const entry = CATALOG_BY_ID[id];
      if (!entry) return;
      persist({ ...persisted, activeId: id });
      setChartSymbol(entry.symbol);
    },
    [persisted, persist, setChartSymbol]
  );

  const add = useCallback(
    (id: string) => {
      if (!CATALOG_BY_ID[id] || persisted.items.some((i) => i.id === id)) return;
      const next: WatchlistPersistedState = {
        ...persisted,
        items: [...persisted.items, { id }],
        activeId: persisted.activeId ?? id,
      };
      persist(next);
    },
    [persisted, persist]
  );

  const remove = useCallback(
    (id: string) => {
      const nextItems = persisted.items.filter((i) => i.id !== id);
      const nextActive =
        persisted.activeId === id
          ? (nextItems[0]?.id ?? null)
          : persisted.activeId;
      persist({ ...persisted, items: nextItems, activeId: nextActive });
    },
    [persisted, persist]
  );

  const toggle = useCallback(
    (id: string) => {
      if (persisted.items.some((i) => i.id === id)) {
        remove(id);
      } else {
        add(id);
      }
    },
    [persisted.items, add, remove]
  );

  const togglePin = useCallback(
    (id: string) => {
      const nextItems = persisted.items.map((i) =>
        i.id === id ? { ...i, pinned: !i.pinned } : i
      );
      persist({ ...persisted, items: nextItems });
    },
    [persisted, persist]
  );

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const sorted = sortItems([...persisted.items]);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      persist({ ...persisted, items: sorted });
    },
    [persisted, persist]
  );

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      activeId: persisted.activeId,
      activeItem,
      isFavorite: (id) => persisted.items.some((i) => i.id === id),
      add,
      remove,
      toggle,
      setActive,
      togglePin,
      reorder,
      hydrated,
    }),
    [
      items,
      persisted.activeId,
      persisted.items,
      activeItem,
      add,
      remove,
      toggle,
      setActive,
      togglePin,
      reorder,
      hydrated,
    ]
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return ctx;
}
