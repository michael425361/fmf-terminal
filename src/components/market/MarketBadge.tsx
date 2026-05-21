import {
  getMarketBadge,
  MARKET_BADGE_STYLES,
  type MarketBadgeCode,
} from "@/lib/watchlist/display";
import type { AssetCatalogEntry } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";

export function MarketBadge({
  entry,
  code,
  className,
}: {
  entry?: AssetCatalogEntry;
  code?: MarketBadgeCode;
  className?: string;
}) {
  const badge = code ?? (entry ? getMarketBadge(entry) : "US");
  return (
    <span
      className={cn(
        "rounded border px-1 py-px font-mono text-[8px] font-semibold uppercase tracking-wide",
        MARKET_BADGE_STYLES[badge],
        className
      )}
    >
      {badge}
    </span>
  );
}
