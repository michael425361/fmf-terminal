"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useTranslations } from "next-intl";
import { TICKER_BAR_SYMBOLS } from "@/lib/market-data/symbols";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { TickerChip } from "./TickerChip";
import { TickerSkeleton } from "./MarketSkeleton";

export function MacroTickerBar() {
  const t = useTranslations("tickerBar");
  const { status, getQuote, getPreviousQuote } = useMarketData();
  const { activeId, setActive } = useWatchlist();
  const loading = status === "loading" || status === "idle";

  const symbols = TICKER_BAR_SYMBOLS;
  const listRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeIndex = useMemo(() => {
    const idx = symbols.findIndex((s) => s.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [symbols, activeId]);

  const [rovingIndex, setRovingIndex] = useState(activeIndex);

  useEffect(() => {
    setRovingIndex(activeIndex);
    const id = symbols[activeIndex]?.id;
    if (id) {
      chipRefs.current.get(id)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex, symbols]);

  const onSelect = useCallback(
    (id: string) => {
      setActive(id);
      const el = chipRefs.current.get(id);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    },
    [setActive]
  );

  const onFocusRequest = useCallback((id: string) => {
    const idx = symbols.findIndex((s) => s.id === id);
    if (idx >= 0) setRovingIndex(idx);
  }, [symbols]);

  const focusChipAt = useCallback(
    (index: number) => {
      const clamped =
        ((index % symbols.length) + symbols.length) % symbols.length;
      setRovingIndex(clamped);
      const id = symbols[clamped]?.id;
      if (id) chipRefs.current.get(id)?.focus();
    },
    [symbols]
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const count = symbols.length;
      if (count === 0) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          focusChipAt(rovingIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          focusChipAt(rovingIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          focusChipAt(0);
          break;
        case "End":
          e.preventDefault();
          focusChipAt(count - 1);
          break;
        case "Enter":
        case " ": {
          e.preventDefault();
          const id = symbols[rovingIndex]?.id;
          if (id) onSelect(id);
          break;
        }
        default:
          break;
      }
    },
    [symbols, rovingIndex, focusChipAt, onSelect]
  );

  const setChipRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) chipRefs.current.set(id, el);
    else chipRefs.current.delete(id);
  }, []);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t("navLabel")}
      onKeyDown={handleListKeyDown}
      className="macro-ticker-bar flex items-stretch overflow-x-auto scrollbar-thin"
    >
      {loading ? (
        <TickerSkeleton count={symbols.length} />
      ) : (
        symbols.map((def, index) => (
          <TickerChip
            key={def.id}
            ref={(el) => setChipRef(def.id, el)}
            definition={def}
            quote={getQuote(def.id)}
            previous={getPreviousQuote(def.id)}
            isActive={activeId === def.id}
            tabIndex={rovingIndex === index ? 0 : -1}
            onSelect={onSelect}
            onFocusRequest={onFocusRequest}
          />
        ))
      )}
    </div>
  );
}
