import { Suspense, cache } from "react";
import { Sparkles } from "lucide-react";
import { getOpenAIConfig } from "@/lib/ai/openai-config";
import { buildFinancialContext } from "@/lib/ai/context-engine";
import { explainMove } from "@/lib/ai/explain-move";
import { generateResearchReport } from "@/lib/ai/research-report";
import { analyzeEarnings } from "@/lib/ai/earnings-analysis";
import { rankNews } from "@/lib/ai/news-intelligence";
import type { AISummaryLocale } from "@/lib/ai/locale";
import { ExplainMoveCard } from "./ExplainMoveCard";
import { BullBearCard } from "./BullBearCard";
import { CatalystCard } from "./CatalystCard";
import { NewsImpactCard } from "./NewsImpactCard";
import { EarningsAnalysisCard } from "./EarningsAnalysisCard";
import { AIDisclaimer, CardEmpty, CardShell, ConfidenceBar } from "./ai-ui";

interface AIInsightsPanelProps {
  ticker: string;
  priceChange?: number;
  volumeChange?: number;
  locale?: AISummaryLocale;
  className?: string;
}

/**
 * Request-scoped, deduped context builder. Multiple Suspense sections request
 * the same context but only one network/AI fetch is performed per render.
 */
const getPanelContext = cache((ticker: string, locale: AISummaryLocale) =>
  buildFinancialContext(ticker, {
    locale,
    includeNewsSummary: true,
    newsDays: 14,
  })
);

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="skeleton mb-3 h-3 w-1/3" />
      <div className="flex flex-col gap-2" aria-hidden>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-3"
            style={{ width: `${92 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function Unavailable({ locale }: { locale: AISummaryLocale }) {
  return (
    <CardShell
      title={locale === "zh" ? "暂不可用" : "Unavailable"}
      accent="neutral"
    >
      <CardEmpty
        message={
          locale === "zh"
            ? "AI 分析暂时不可用"
            : "AI analysis temporarily unavailable"
        }
      />
    </CardShell>
  );
}

async function ExplainMoveSection({
  ticker,
  priceChange,
  volumeChange,
  locale,
}: {
  ticker: string;
  priceChange: number;
  volumeChange: number;
  locale: AISummaryLocale;
}) {
  try {
    const context = await getPanelContext(ticker, locale);
    const data = await explainMove(
      { ticker, priceChange, volumeChange },
      { locale, context }
    );
    return <ExplainMoveCard data={data} locale={locale} />;
  } catch {
    return <Unavailable locale={locale} />;
  }
}

async function NewsSection({
  ticker,
  locale,
}: {
  ticker: string;
  locale: AISummaryLocale;
}) {
  try {
    const context = await getPanelContext(ticker, locale);
    const ranked = await rankNews(context.recentNews, {
      ticker,
      locale,
      limit: 6,
    });
    return (
      <NewsImpactCard
        ranked={ranked}
        summary={context.newsSummary}
        locale={locale}
      />
    );
  } catch {
    return <Unavailable locale={locale} />;
  }
}

async function ResearchSection({
  ticker,
  locale,
}: {
  ticker: string;
  locale: AISummaryLocale;
}) {
  try {
    const context = await getPanelContext(ticker, locale);
    const report = await generateResearchReport(ticker, { locale, context });
    return (
      <div className="flex flex-col gap-3">
        <CardShell
          title={locale === "zh" ? "研究摘要" : "Executive Summary"}
          accent="neutral"
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-[1.65] text-[var(--foreground)]/85">
              {report.executiveSummary}
            </p>
            <ConfidenceBar value={report.confidence} locale={locale} />
          </div>
        </CardShell>
        <BullBearCard
          bullCase={report.bullCase}
          bearCase={report.bearCase}
          locale={locale}
        />
        <CatalystCard
          catalysts={report.catalysts}
          risks={report.risks}
          locale={locale}
        />
        {report.valuationView && (
          <CardShell
            title={locale === "zh" ? "估值观点" : "Valuation View"}
            accent="neutral"
          >
            <p className="text-xs leading-[1.65] text-[var(--foreground)]/85">
              {report.valuationView}
            </p>
          </CardShell>
        )}
      </div>
    );
  } catch {
    return <Unavailable locale={locale} />;
  }
}

async function EarningsSection({
  ticker,
  locale,
}: {
  ticker: string;
  locale: AISummaryLocale;
}) {
  try {
    const context = await getPanelContext(ticker, locale);
    const data = await analyzeEarnings(ticker, { locale, context });
    return <EarningsAnalysisCard data={data} locale={locale} />;
  } catch {
    return <Unavailable locale={locale} />;
  }
}

/**
 * AI Insights Panel (Phase 8).
 *
 * Bloomberg-style, dark-mode compatible, mobile responsive server component.
 * Each section streams independently via Suspense so the panel renders
 * progressively rather than blocking on the slowest model call.
 */
export function AIInsightsPanel({
  ticker,
  priceChange = 0,
  volumeChange = 0,
  locale = "en",
  className,
}: AIInsightsPanelProps) {
  const configured = getOpenAIConfig().isConfigured;
  const symbol = ticker.trim().toUpperCase();
  const heading = locale === "zh" ? "AI 智能分析" : "AI Intelligence";

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-2 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">
              {heading}
            </h2>
            <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {symbol}
            </span>
          </div>
        </header>

        {!configured ? (
          <Unavailable locale={locale} />
        ) : (
          <>
            <Suspense fallback={<CardSkeleton lines={3} />}>
              <ExplainMoveSection
                ticker={symbol}
                priceChange={priceChange}
                volumeChange={volumeChange}
                locale={locale}
              />
            </Suspense>

            <Suspense fallback={<CardSkeleton lines={4} />}>
              <NewsSection ticker={symbol} locale={locale} />
            </Suspense>

            <Suspense fallback={<CardSkeleton lines={5} />}>
              <ResearchSection ticker={symbol} locale={locale} />
            </Suspense>

            <Suspense fallback={<CardSkeleton lines={4} />}>
              <EarningsSection ticker={symbol} locale={locale} />
            </Suspense>
          </>
        )}

        <AIDisclaimer locale={locale} />
      </div>
    </div>
  );
}
