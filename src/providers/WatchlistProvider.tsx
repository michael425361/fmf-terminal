"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  syncWatchlistSymbols,
} from "@/lib/watchlist/watchlist";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
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
  cloudSyncing: boolean;
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

function mergeCloudSymbols(
  prev: WatchlistPersistedState,
  cloudSymbols: string[]
): WatchlistPersistedState {
  const localIds = new Set(prev.items.map((i) => i.id));
  const mergedIds = [...new Set([...cloudSymbols, ...localIds])];
  const items = mergedIds.map((id) => {
    const existing = prev.items.find((i) => i.id === id);
    return existing ?? { id };
  });
  const activeId =
    prev.activeId && mergedIds.includes(prev.activeId)
      ? prev.activeId
      : items[0]?.id ?? null;
  return { ...prev, items, activeId };
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user, showToast } = useAuth();
  const { setChartSymbol, loadWatchlistMarketData } = useMarketData();
  const [persisted, setPersisted] = useState<WatchlistPersistedState>(
    createDefaultWatchlistState
  );
  const [hydrated, setHydrated] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const cloudLoadedRef = useRef<string | null>(null);

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

  const syncToCloud = useCallback(
    async (symbols: string[], userId: string) => {
      if (!isSupabaseConfigured()) return;
      try {
        await syncWatchlistSymbols(symbols, userId);
      } catch {
        showToast("Watchlist sync failed", "error");
      }
    },
    [showToast]
  );

  const persist = useCallback(
    (
      next:
        | WatchlistPersistedState
        | ((prev: WatchlistPersistedState) => WatchlistPersistedState),
      options?: { skipCloud?: boolean }
    ) => {
      setPersisted((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        saveWatchlistState(resolved);
        if (
          !options?.skipCloud &&
          user?.id &&
          isSupabaseConfigured()
        ) {
          const symbols = resolved.items.map((i) => i.id);
          void syncToCloud(symbols, user.id);
        }
        return resolved;
      });
    },
    [user?.id, syncToCloud]
  );

  useEffect(() => {
    if (!hydrated || !user?.id || !isSupabaseConfigured()) return;
    if (cloudLoadedRef.current === user.id) return;

    let cancelled = false;
    setCloudSyncing(true);

    void (async () => {
      try {
        const cloud = await getWatchlist(user.id);
        if (cancelled) return;
        cloudLoadedRef.current = user.id;

        setPersisted((prev) => {
          const merged = mergeCloudSymbols(prev, cloud);
          saveWatchlistState(merged);
          void syncWatchlistSymbols(
            merged.items.map((i) => i.id),
            user.id
          ).catch(() => showToast("Watchlist sync failed", "error"));
          return merged;
        });
      } catch {
        if (!cancelled) showToast("Could not load cloud watchlist", "error");
      } finally {
        if (!cancelled) setCloudSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user?.id, showToast]);

  useEffect(() => {
    if (!user?.id) cloudLoadedRef.current = null;
  }, [user?.id]);

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
      if (user?.id && isSupabaseConfigured()) {
        void addToWatchlist(id, user.id).catch(() =>
          showToast("Watchlist sync failed", "error")
        );
      }
    },
    [persist, user?.id, showToast]
  );

  const remove = useCallback(
    (id: string) => {
      persist((prev) => {
        const nextItems = prev.items.filter((i) => i.id !== id);
        const nextActive =
          prev.activeId === id ? (nextItems[0]?.id ?? null) : prev.activeId;
        return { ...prev, items: nextItems, activeId: nextActive };
      });
      if (user?.id && isSupabaseConfigured()) {
        void removeFromWatchlist(id, user.id).catch(() =>
          showToast("Watchlist sync failed", "error")
        );
      }
    },
    [persist, user?.id, showToast]
  );

  const toggle = useCallback(
    (id: string) => {
      const has = persisted.items.some((i) => i.id === id);
      if (has) {
        remove(id);
        return;
      }
      add(id);
    },
    [persisted.items, add, remove]
  );

  const togglePin = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === id ? { ...i, pinned: !i.pinned } : i
          ),
        }),
        { skipCloud: true }
      );
    },
    [persist]
  );

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      persist(
        (prev) => {
          const sorted = sortItems([...prev.items]);
          const [moved] = sorted.splice(fromIndex, 1);
          sorted.splice(toIndex, 0, moved);
          return { ...prev, items: sorted };
        },
        { skipCloud: true }
      );
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
      cloudSyncing,
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
      cloudSyncing,
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
