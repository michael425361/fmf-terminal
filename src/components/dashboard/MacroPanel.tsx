"use client";

import { useTranslations } from "next-intl";
import {
  CATEGORY_ORDER,
  MARKET_SYMBOLS,
} from "@/lib/market-data/symbols";
import type { MarketCategory } from "@/lib/market-data/types";
import { useMarketData } from "@/providers/MarketDataProvider";
import { FavoriteButton } from "@/components/watchlist/FavoriteButton";
import { formatSignedPercent, getQuoteColorClass } from "@/lib/market-data/format";
import { formatQuotePrice } from "@/lib/market-data/format";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { cn } from "@/lib/utils";

export function MacroPanel() {
  const tMarket = useTranslations("market");
  const tAssets = useTranslations("market.assets");
  const { getQuote } = useMarketData();
  const { setActive } = useWatchlist();

  return (
    <section className="panel flex flex-col">
      <div className="panel-header">
        <span>{tMarket("macroTitle")}</span>
        <span className="font-mono text-[var(--accent)]">
          {MARKET_SYMBOLS.length}
        </span>
      </div>
      <div>
        {CATEGORY_ORDER.map((category) => (
          <CategoryBlock
            key={category}
            category={category}
            title={tMarket(`categories.${category}`)}
            tAssets={tAssets}
            getQuote={getQuote}
            setActive={setActive}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryBlock({
  category,
  title,
  tAssets,
  getQuote,
  setActive,
}: {
  category: MarketCategory;
  title: string;
  tAssets: ReturnType<typeof useTranslations>;
  getQuote: ReturnType<typeof useMarketData>["getQuote"];
  setActive: (id: string) => void;
}) {
  const symbols = MARKET_SYMBOLS.filter((s) => s.category === category);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--surface-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
        {title}
      </div>
      {symbols.map((def) => {
        const quote = getQuote(def.id);
        return (
          <div
            key={def.id}
            role="button"
            tabIndex={0}
            onClick={() => setActive(def.id)}
            onKeyDown={(e) => e.key === "Enter" && setActive(def.id)}
            className="group flex cursor-pointer items-center justify-between gap-2 border-b border-[var(--border)]/30 px-3 py-2 transition hover:bg-[var(--surface-elevated)]"
          >
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold">{def.shortLabel}</div>
              <div className="truncate text-[10px] text-[var(--muted)]">
                {tAssets(`${def.id}.name`)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {quote ? (
                <div className="text-right">
                  <div className="font-mono text-xs">
                    {formatQuotePrice(quote.price, quote.priceDecimals ?? 2)}
                  </div>
                  <div
                    className={cn(
                      "font-mono text-[10px]",
                      getQuoteColorClass(quote)
                    )}
                  >
                    {formatSignedPercent(quote.changePercent)}
                  </div>
                </div>
              ) : (
                <div className="skeleton h-8 w-14" />
              )}
              <FavoriteButton assetId={def.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
