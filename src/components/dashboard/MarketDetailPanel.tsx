"use client";

import { useTranslations } from "next-intl";
import { formatQuotePrice, formatSignedChange, formatSignedPercent, getQuoteColorClass } from "@/lib/market-data/format";
import { useMarketData } from "@/providers/MarketDataProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { FavoriteButton } from "@/components/watchlist/FavoriteButton";
import { cn } from "@/lib/utils";

export function MarketDetailPanel() {
  const t = useTranslations("personalWatchlist");
  const { activeItem } = useWatchlist();
  const { getQuote } = useMarketData();

  if (!activeItem) return null;

  const quote = getQuote(activeItem.id);

  return (
    <section className="panel shrink-0 overflow-hidden">
      <div className="panel-header">
        <span>{t("detailTitle")}</span>
        <FavoriteButton assetId={activeItem.id} />
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
        <DetailCell label={t("symbol")} value={activeItem.symbol} mono />
        <DetailCell label={t("name")} value={activeItem.name} />
        <DetailCell
          label={t("last")}
          value={
            quote
              ? formatQuotePrice(
                  quote.price,
                  quote.priceDecimals ?? 2,
                  quote.category
                )
              : "—"
          }
          mono
        />
        <DetailCell
          label={t("change")}
          value={quote ? formatSignedChange(quote.change) : "—"}
          mono
          className={quote ? getQuoteColorClass(quote) : undefined}
        />
        <DetailCell
          label={t("changePct")}
          value={quote ? formatSignedPercent(quote.changePercent) : "—"}
          mono
          className={quote ? getQuoteColorClass(quote) : undefined}
        />
        <DetailCell label={t("type")} value={activeItem.assetType.replace("_", " ")} />
      </div>
    </section>
  );
}

function DetailCell({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="rounded border border-[var(--border)]/60 bg-[var(--background)] px-2.5 py-2">
      <div className="text-[10px] text-[var(--muted)]">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-xs font-medium",
          mono && "font-mono",
          className
        )}
      >
        {value}
      </div>
    </div>
  );
}
