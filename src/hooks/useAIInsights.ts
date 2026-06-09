"use client";

import { useCallback, useRef, useState } from "react";
import { useAISummaryLocale } from "@/hooks/useAIMarketSummary";
import type { AISummaryLocale } from "@/lib/ai/locale";
import type { ExplainMoveResult } from "@/lib/ai/explain-move";
import type { ResearchReportResult } from "@/lib/ai/research-report";
import type { EarningsAnalysisResult } from "@/lib/ai/earnings-analysis";
import type { NewsSummary, RankedNewsItem } from "@/lib/ai/news-intelligence";

export interface NewsIntelligencePayload {
  scope: string;
  summary: NewsSummary;
  ranked: RankedNewsItem[];
  generatedAt: number;
}

type SectionState<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
};

function emptySection<T>(): SectionState<T> {
  return { data: null, loading: false, error: false };
}

interface UseAIInsightsArgs {
  symbol: string | null;
  priceChange?: number;
  volumeChange?: number;
}

async function postAI<T>(
  path: string,
  body: Record<string, unknown>,
  locale: AISummaryLocale,
  signal: AbortSignal
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-FMF-Locale": locale,
      "Accept-Language": locale === "zh" ? "zh-CN,zh" : "en",
    },
    body: JSON.stringify(body),
    signal,
  });
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string };
  if (!res.ok || !json.ok || json.data == null) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  return json.data;
}

/**
 * Client hook that drives the AI Intelligence Layer API routes on demand.
 * Each section resolves independently so cards can stream into the UI.
 */
export function useAIInsights({
  symbol,
  priceChange = 0,
  volumeChange = 0,
}: UseAIInsightsArgs) {
  const locale = useAISummaryLocale();
  const [hasRun, setHasRun] = useState(false);
  const [explain, setExplain] = useState<SectionState<ExplainMoveResult>>(emptySection);
  const [research, setResearch] = useState<SectionState<ResearchReportResult>>(emptySection);
  const [earnings, setEarnings] = useState<SectionState<EarningsAnalysisResult>>(emptySection);
  const [news, setNews] = useState<SectionState<NewsIntelligencePayload>>(emptySection);

  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    if (!symbol) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setHasRun(true);
    setExplain({ data: null, loading: true, error: false });
    setResearch({ data: null, loading: true, error: false });
    setEarnings({ data: null, loading: true, error: false });
    setNews({ data: null, loading: true, error: false });

    const base = { ticker: symbol, locale };

    void postAI<ExplainMoveResult>(
      "/api/ai/explain-move",
      { ...base, priceChange, volumeChange },
      locale,
      signal
    )
      .then((data) => setExplain({ data, loading: false, error: false }))
      .catch(() => {
        if (!signal.aborted) setExplain({ data: null, loading: false, error: true });
      });

    void postAI<ResearchReportResult>("/api/ai/research-report", base, locale, signal)
      .then((data) => setResearch({ data, loading: false, error: false }))
      .catch(() => {
        if (!signal.aborted) setResearch({ data: null, loading: false, error: true });
      });

    void postAI<EarningsAnalysisResult>("/api/ai/earnings-analysis", base, locale, signal)
      .then((data) => setEarnings({ data, loading: false, error: false }))
      .catch(() => {
        if (!signal.aborted) setEarnings({ data: null, loading: false, error: true });
      });

    void postAI<NewsIntelligencePayload>("/api/ai/news-summary", base, locale, signal)
      .then((data) => setNews({ data, loading: false, error: false }))
      .catch(() => {
        if (!signal.aborted) setNews({ data: null, loading: false, error: true });
      });
  }, [symbol, priceChange, volumeChange, locale]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setHasRun(false);
    setExplain(emptySection());
    setResearch(emptySection());
    setEarnings(emptySection());
    setNews(emptySection());
  }, []);

  return { locale, hasRun, explain, research, earnings, news, run, reset };
}
