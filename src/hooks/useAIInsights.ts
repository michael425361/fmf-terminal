"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  errorMessage?: string;
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
  signal: AbortSignal,
  authMessage: string
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-FMF-Locale": locale,
      "Accept-Language": locale === "zh" ? "zh-CN,zh" : "en",
    },
    body: JSON.stringify(body),
    signal,
  });
  const json = (await res.json()) as {
    ok?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
  if (!res.ok || !json.ok || json.data == null) {
    const message =
      json.message ??
      (json.error === "auth_required" ? authMessage : json.error) ??
      `Request failed (${res.status})`;
    throw new Error(message);
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
  const t = useTranslations("aiSummary");
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
    const authMessage = t("authRequired");
    const fallbackError = t("unavailable");

    const onError = (err: unknown) => ({
      data: null,
      loading: false,
      error: true,
      errorMessage: err instanceof Error ? err.message : fallbackError,
    });

    void postAI<ExplainMoveResult>(
      "/api/ai/explain-move",
      { ...base, priceChange, volumeChange },
      locale,
      signal,
      authMessage
    )
      .then((data) => setExplain({ data, loading: false, error: false }))
      .catch((err) => {
        if (!signal.aborted) setExplain(onError(err));
      });

    void postAI<ResearchReportResult>(
      "/api/ai/research-report",
      base,
      locale,
      signal,
      authMessage
    )
      .then((data) => setResearch({ data, loading: false, error: false }))
      .catch((err) => {
        if (!signal.aborted) setResearch(onError(err));
      });

    void postAI<EarningsAnalysisResult>(
      "/api/ai/earnings-analysis",
      base,
      locale,
      signal,
      authMessage
    )
      .then((data) => setEarnings({ data, loading: false, error: false }))
      .catch((err) => {
        if (!signal.aborted) setEarnings(onError(err));
      });

    void postAI<NewsIntelligencePayload>(
      "/api/ai/news-summary",
      base,
      locale,
      signal,
      authMessage
    )
      .then((data) => setNews({ data, loading: false, error: false }))
      .catch((err) => {
        if (!signal.aborted) setNews(onError(err));
      });
  }, [symbol, priceChange, volumeChange, locale, t]);

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
