"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAIMarketSummary, useAISummaryLocale } from "@/hooks/useAIMarketSummary";
import { formatRelativeTime } from "@/lib/news/relative-time";
import type { OHLCVBar } from "@/lib/chart/types";
import { formatSignedPercent, getQuoteColorClass } from "@/lib/market-data/format";
import type { MarketQuote } from "@/lib/market-data/types";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import type { MarketSummarySentiment } from "@/lib/ai/types";
import type { WatchlistItemView } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";

interface AISummaryCardProps {
  asset: WatchlistItemView | null;
  market: DetectedMarket;
  quote?: MarketQuote;
  candles: OHLCVBar[];
  className?: string;
}

const SENTIMENT_STYLES: Record<
  MarketSummarySentiment,
  { badge: string; dot: string }
> = {
  bullish: {
    badge:
      "border-[var(--positive)]/35 bg-[var(--positive)]/10 text-[var(--positive)]",
    dot: "bg-[var(--positive)]",
  },
  bearish: {
    badge:
      "border-[var(--negative)]/35 bg-[var(--negative)]/10 text-[var(--negative)]",
    dot: "bg-[var(--negative)]",
  },
  neutral: {
    badge: "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]",
    dot: "bg-[var(--muted)]",
  },
};

function SentimentBadge({
  sentiment,
  label,
}: {
  sentiment: MarketSummarySentiment;
  label: string;
}) {
  const style = SENTIMENT_STYLES[sentiment];
  return (
    <span
      className={cn(
        "ai-sentiment-badge inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold",
        style.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {label}
    </span>
  );
}

function HighlightPill({ text, isZh }: { text: string; isZh: boolean }) {
  const label = text.trim();
  if (!label) return null;
  return (
    <span
      className={cn(
        "ai-brief-pill text-[10px] text-[var(--foreground)]/85",
        isZh
          ? "font-sans tracking-normal normal-case"
          : "font-mono uppercase tracking-wide"
      )}
    >
      {label}
    </span>
  );
}

function BriefSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-[94%]" />
      <div className="skeleton h-3 w-[88%]" />
      <div className="skeleton h-3 w-[72%]" />
      <div className="mt-1 flex flex-wrap gap-2">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-6 w-28" />
        <div className="skeleton h-6 w-20" />
      </div>
    </div>
  );
}

export function AISummaryCard({
  asset,
  market,
  quote,
  candles,
  className,
}: AISummaryCardProps) {
  const t = useTranslations("aiSummary");
  const uiLocale = useAISummaryLocale();
  const isZh = uiLocale === "zh";

  const { data, loading, refresh, canRefresh, cooldownSeconds } =
    useAIMarketSummary({
      symbol: asset?.symbol ?? null,
      market,
      quote,
      candles,
      enabled: Boolean(asset?.symbol && candles.length >= 2),
    });

  const unavailable = data?.unavailable === true;
  const hasSummary = Boolean(data?.summary && !unavailable);
  const sentiment = (data?.sentiment ?? "neutral") as MarketSummarySentiment;
  const sentimentLabel = t(`sentimentValues.${sentiment}`);
  const generatedLabel =
    data?.generatedAt && hasSummary
      ? formatRelativeTime(new Date(data.generatedAt).toISOString(), uiLocale)
      : null;

  const showLoading = loading && !hasSummary;

  return (
    <section
      className={cn("ai-brief-panel panel shrink-0 overflow-hidden", className)}
      aria-labelledby="ai-brief-title"
    >
      <header className="ai-brief-header flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 sm:px-4">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <h2
            id="ai-brief-title"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]"
          >
            {t("briefTitle")}
          </h2>
          <span className="ai-brief-badge rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            AI
          </span>
          {asset && (
            <span className="truncate font-mono text-[10px] text-[var(--accent)]">
              {asset.shortLabel}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasSummary && (
            <SentimentBadge sentiment={sentiment} label={sentimentLabel} />
          )}
          <button
            type="button"
            onClick={() => refresh()}
            disabled={!canRefresh || !asset}
            aria-label={t("refresh")}
            className="ai-brief-refresh flex h-7 min-w-[4.5rem] items-center justify-center gap-1 rounded border border-[var(--border)] px-2 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span>
              {cooldownSeconds > 0
                ? t("refreshCooldown", { seconds: cooldownSeconds })
                : t("refreshShort")}
            </span>
          </button>
        </div>
      </header>

      <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
        {!asset ? (
          <p className="text-xs text-[var(--muted)]">{t("selectSymbol")}</p>
        ) : showLoading ? (
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]/90">
              {t("generating")}
            </p>
            <BriefSkeleton />
          </div>
        ) : unavailable ? (
          <div className="ai-brief-unavailable rounded border border-[var(--border)]/80 bg-[var(--background)] px-3 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {t("unavailableTitle")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              {t("unavailable")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--muted)]">
              {quote && (
                <span className="font-mono text-xs text-[var(--foreground)]">
                  {t("lastPrice")}{" "}
                  <span className="font-semibold">
                    {quote.price.toFixed(quote.priceDecimals ?? 2)}
                  </span>{" "}
                  <span className={getQuoteColorClass(quote)}>
                    {formatSignedPercent(quote.changePercent)}
                  </span>
                </span>
              )}
              {generatedLabel && (
                <span className="font-mono uppercase tracking-wide">
                  {t("generated")} {generatedLabel}
                </span>
              )}
              {data?.cached && (
                <span className="font-mono uppercase tracking-wide opacity-70">
                  {t("cached")}
                </span>
              )}
            </div>

            <p
              className={cn(
                "min-w-0 break-words text-xs leading-[1.65] text-[var(--foreground)]/92",
                isZh && "leading-[1.75] tracking-normal"
              )}
            >
              {data?.summary}
            </p>

            {data?.highlights && data.highlights.length > 0 && (
              <div className="flex min-w-0 flex-wrap gap-1.5 border-t border-[var(--border)]/50 pt-3">
                {data.highlights.map((line, i) => (
                  <HighlightPill key={`${line}-${i}`} text={line} isZh={isZh} />
                ))}
              </div>
            )}
          </>
        )}

        <p className="ai-brief-disclaimer border-t border-[var(--border)]/40 pt-2 text-[9px] leading-snug text-[var(--muted)]/70">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
