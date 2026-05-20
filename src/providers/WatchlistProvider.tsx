"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCatalogEntryById,
  registerCatalogEntry,
} from "@/lib/watchlist/catalog-registry";
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
  setActive: (
    id: string,
    entry?: import("@/lib/watchlist/types").AssetCatalogEntry
  ) => void;
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
      const entry = getCatalogEntryById(item.id);
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
      const fromCatalog = getCatalogEntryById(id);
      if (fromCatalog) {
        const pinned = persisted.items.find((i) => i.id === id)?.pinned ?? false;
        return { ...fromCatalog, pinned, order: -1 };
      }
    }
    return items[0] ?? null;
  }, [items, persisted.activeId, persisted.items]);

  const persist = useCallback(
    (
      next:
        | WatchlistPersistedState
        | ((prev: WatchlistPersistedState) => WatchlistPersistedState)
    ) => {
      setPersisted((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        saveWatchlistState(resolved);
        return resolved;
      });
    },
    []
  );

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  useEffect(() => {
    if (!hydrated) return;
    const activeId = persisted.activeId;
    const loadIds = activeId && !ids.includes(activeId) ? [...ids, activeId] : ids;
    if (loadIds.length === 0) return;
    loadWatchlistMarketData(loadIds);
  }, [hydrated, ids, persisted.activeId, loadWatchlistMarketData]);

  useEffect(() => {
    if (!hydrated || !activeItem) return;
    setChartSymbol(activeItem.symbol);
  }, [hydrated, activeItem?.id, activeItem?.symbol, setChartSymbol]);

  const setActive = useCallback(
    (id: string, entry?: import("@/lib/watchlist/types").AssetCatalogEntry) => {
      const resolved = entry ?? getCatalogEntryById(id);
      if (!resolved) return;
      registerCatalogEntry(resolved);
      persist((prev) => ({ ...prev, activeId: resolved.id }));
      setChartSymbol(resolved.symbol);
    },
    [persist, setChartSymbol]
  );

  const add = useCallback(
    (id: string) => {
      const entry = getCatalogEntryById(id);
      if (!entry) return;
      registerCatalogEntry(entry);
      persist((prev) => {
        if (prev.items.some((i) => i.id === id)) return prev;
        return {
          ...prev,
          items: [...prev.items, { id }],
          activeId: prev.activeId ?? id,
        };
      });
    },
    [persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist((prev) => {
        const nextItems = prev.items.filter((i) => i.id !== id);
        const nextActive =
          prev.activeId === id ? (nextItems[0]?.id ?? null) : prev.activeId;
        return { ...prev, items: nextItems, activeId: nextActive };
      });
    },
    [persist]
  );

  const toggle = useCallback(
    (id: string) => {
      setPersisted((prev) => {
        if (prev.items.some((i) => i.id === id)) {
          const nextItems = prev.items.filter((i) => i.id !== id);
          const nextActive =
            prev.activeId === id ? (nextItems[0]?.id ?? null) : prev.activeId;
          const next = { ...prev, items: nextItems, activeId: nextActive };
          saveWatchlistState(next);
          return next;
        }
        const entry = getCatalogEntryById(id);
        if (!entry) return prev;
        registerCatalogEntry(entry);
        const next = {
          ...prev,
          items: [...prev.items, { id }],
          activeId: prev.activeId ?? id,
        };
        saveWatchlistState(next);
        return next;
      });
    },
    []
  );

  const togglePin = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === id ? { ...i, pinned: !i.pinned } : i
        ),
      }));
    },
    [persist]
  );

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      persist((prev) => {
        const sorted = sortItems([...prev.items]);
        const [moved] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, moved);
        return { ...prev, items: sorted };
      });
    },
    [persist]
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
