"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useAIInsights } from "@/hooks/useAIInsights";
import type { MarketQuote } from "@/lib/market-data/types";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";
import { cn } from "@/lib/utils";
import { ExplainMoveCard } from "./ExplainMoveCard";
import { NewsImpactCard } from "./NewsImpactCard";
import { BullBearCard } from "./BullBearCard";
import { CatalystCard } from "./CatalystCard";
import { EarningsAnalysisCard } from "./EarningsAnalysisCard";
import { AIDisclaimer, CardEmpty, CardShell, ConfidenceBar } from "./ai-ui";

interface AIInsightsClientPanelProps {
  symbol: string | null;
  market: DetectedMarket;
  quote?: MarketQuote;
  className?: string;
}

function volumeChangePercent(quote?: MarketQuote): number {
  if (!quote?.volume || !quote.averageVolume || quote.averageVolume <= 0) return 0;
  return ((quote.volume - quote.averageVolume) / quote.averageVolume) * 100;
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="skeleton mb-3 h-3 w-1/3" />
      <div className="flex flex-col gap-2" aria-hidden>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-3" style={{ width: `${92 - i * 8}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Client-driven AI Intelligence panel. Consumes the /api/ai/* routes on demand
 * (one click) to avoid firing multiple model calls on every symbol change.
 */
export function AIInsightsClientPanel({
  symbol,
  market,
  quote,
  className,
}: AIInsightsClientPanelProps) {
  const { locale, hasRun, explain, research, earnings, news, run } = useAIInsights({
    symbol,
    priceChange: quote?.changePercent ?? 0,
    volumeChange: volumeChangePercent(quote),
  });

  const zh = locale === "zh";
  const supported = market === "us";
  const heading = zh ? "AI 深度分析" : "AI Deep Analysis";

  return (
    <section
      className={cn("panel shrink-0 overflow-hidden", className)}
      aria-labelledby="ai-insights-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          <h2
            id="ai-insights-title"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]"
          >
            {heading}
          </h2>
          {symbol && (
            <span className="font-mono text-[10px] text-[var(--accent)]">{symbol}</span>
          )}
        </div>

        {supported && symbol && (
          <button
            type="button"
            onClick={() => run()}
            className="flex h-7 items-center gap-1.5 rounded border border-[var(--border)] px-2.5 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            {hasRun ? (zh ? "重新生成" : "Regenerate") : zh ? "运行分析" : "Run Analysis"}
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 p-3 sm:p-4">
        {!symbol ? (
          <CardEmpty message={zh ? "请选择标的" : "Select a symbol"} />
        ) : !supported ? (
          <CardEmpty
            message={
              zh
                ? "深度分析目前仅支持美股标的"
                : "Deep analysis is currently available for US equities"
            }
          />
        ) : !hasRun ? (
          <div className="rounded border border-dashed border-[var(--border)] bg-[var(--background)] px-3 py-6 text-center">
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              {zh
                ? "点击「运行分析」生成异动解读、新闻影响、多空观点、催化剂与财报分析。"
                : "Run analysis to generate explain-move, news impact, bull/bear case, catalysts and earnings analysis."}
            </p>
          </div>
        ) : (
          <>
            {explain.loading ? (
              <SectionSkeleton lines={3} />
            ) : explain.error || !explain.data ? null : (
              <ExplainMoveCard data={explain.data} locale={locale} />
            )}

            {news.loading ? (
              <SectionSkeleton lines={4} />
            ) : news.error || !news.data ? null : (
              <NewsImpactCard
                ranked={news.data.ranked}
                summary={news.data.summary}
                locale={locale}
              />
            )}

            {research.loading ? (
              <SectionSkeleton lines={5} />
            ) : research.error || !research.data ? null : (
              <>
                <CardShell
                  title={zh ? "研究摘要" : "Executive Summary"}
                  accent="neutral"
                >
                  <div className="flex flex-col gap-3">
                    <p className="text-xs leading-[1.65] text-[var(--foreground)]/85">
                      {research.data.executiveSummary}
                    </p>
                    <ConfidenceBar value={research.data.confidence} locale={locale} />
                  </div>
                </CardShell>
                <BullBearCard
                  bullCase={research.data.bullCase}
                  bearCase={research.data.bearCase}
                  locale={locale}
                />
                <CatalystCard
                  catalysts={research.data.catalysts}
                  risks={research.data.risks}
                  locale={locale}
                />
              </>
            )}

            {earnings.loading ? (
              <SectionSkeleton lines={4} />
            ) : earnings.error || !earnings.data ? null : (
              <EarningsAnalysisCard data={earnings.data} locale={locale} />
            )}
          </>
        )}

        <AIDisclaimer locale={locale} />
      </div>
    </section>
  );
}
