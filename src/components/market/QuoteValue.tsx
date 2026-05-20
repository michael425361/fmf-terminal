"use client";

import type { MarketQuote } from "@/lib/market-data/types";
import {
  formatQuotePrice,
  formatSignedChange,
  formatSignedPercent,
  getFlashClass,
  getQuoteColorClass,
} from "@/lib/market-data/format";
import { cn } from "@/lib/utils";

interface QuoteValueProps {
  quote: MarketQuote;
  previous?: MarketQuote;
  showChange?: boolean;
  className?: string;
}

export function QuoteValue({
  quote,
  previous,
  showChange = true,
  className,
}: QuoteValueProps) {
  const decimals = quote.priceDecimals ?? 2;
  const flash = getFlashClass(quote, previous);

  return (
    <div className={cn("transition-colors duration-500", flash, className)}>
      <div className="font-mono text-sm font-medium text-[var(--foreground)] transition-all duration-300">
        {formatQuotePrice(quote.price, decimals, quote.category)}
      </div>
      {showChange && (
        <div className="mt-0.5 flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono text-xs transition-colors duration-300",
              getQuoteColorClass(quote)
            )}
          >
            {formatSignedChange(quote.change, decimals)}
          </span>
          <span
            className={cn(
              "font-mono text-xs transition-colors duration-300",
              getQuoteColorClass(quote)
            )}
          >
            {formatSignedPercent(quote.changePercent)}
          </span>
        </div>
      )}
    </div>
  );
}
