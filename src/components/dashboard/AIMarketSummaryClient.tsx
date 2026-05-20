"use client";

import { Brain, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatSignedPercent, getQuoteColorClass } from "@/lib/market-data/format";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { FavoriteButton } from "@/components/watchlist/FavoriteButton";
import { cn } from "@/lib/utils";

export function AIMarketSummaryClient() {
  const t = useTranslations("aiSummary");
  const tCtx = useTranslations("personalWatchlist.aiContext");
  const { activeItem } = useWatchlist();
  const { getQuote } = useMarketData();
  const quote = activeItem ? getQuote(activeItem.id) : undefined;

  const sentiment = quote
    ? quote.changePercent >= 0
      ? tCtx("bullish")
      : tCtx("bearish")
    : tCtx("neutral");

  const bullets = activeItem
    ? [
        tCtx("bullet1", {
          name: activeItem.name,
          symbol: activeItem.symbol,
        }),
        quote
          ? tCtx("bullet2", {
              price: quote.price.toFixed(2),
              change: formatSignedPercent(quote.changePercent),
            })
          : tCtx("bullet2pending"),
        tCtx("bullet3"),
      ]
    : [tCtx("bulletDefault")];

  return (
    <section className="panel flex flex-col overflow-hidden">
      <div className="panel-header">
        <span className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-[var(--info)]" />
          {t("title")}
        </span>
        <span className="flex items-center gap-2 font-normal normal-case tracking-normal">
          {activeItem && (
            <>
              <span className="font-mono text-[var(--accent)]">
                {activeItem.shortLabel}
              </span>
              <FavoriteButton assetId={activeItem.id} />
            </>
          )}
          <Sparkles className="h-3 w-3 text-[var(--accent)]" />
        </span>
      </div>

      <div className="flex flex-col gap-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {t("sentiment")} · {activeItem?.shortLabel ?? "—"}
            </div>
            <div
              className={cn(
                "mt-0.5 text-sm font-semibold",
                quote ? getQuoteColorClass(quote) : "text-[var(--accent)]"
              )}
            >
              {sentiment}
            </div>
          </div>
          {quote && (
            <div className="rounded border border-[var(--border)]/60 bg-[var(--background)] px-3 py-2">
              <div className="text-[10px] text-[var(--muted)]">{tCtx("focus")}</div>
              <div className="mt-0.5 font-mono text-xs font-medium">
                {quote.price.toFixed(quote.priceDecimals ?? 2)}{" "}
                <span className={getQuoteColorClass(quote)}>
                  {formatSignedPercent(quote.changePercent)}
                </span>
              </div>
            </div>
          )}
        </div>

        <ul className="space-y-2 text-xs leading-relaxed text-[var(--foreground)]/90">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="border-t border-[var(--border)] pt-3 text-[10px] text-[var(--muted)]">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
