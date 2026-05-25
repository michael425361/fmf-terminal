"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { buildIndicatorsFromCandles, slimCandles } from "@/lib/ai/market-context";
import {
  localeFromPathname,
  normalizeAISummaryLocale,
  type AISummaryLocale,
} from "@/lib/ai/locale";
import type { MarketSummaryResponse } from "@/lib/ai/types";
import type { OHLCVBar } from "@/lib/chart/types";
import type { MarketQuote } from "@/lib/market-data/types";
import type { DetectedMarket } from "@/lib/market-data/symbol-normalize";

const REFRESH_COOLDOWN_MS = 30_000;

interface UseAIMarketSummaryOptions {
  symbol: string | null;
  market: DetectedMarket;
  quote?: MarketQuote;
  candles: OHLCVBar[];
  enabled?: boolean;
}

function quoteToInputFixed(quote: MarketQuote | undefined) {
  if (!quote) return null;
  return {
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    currency: quote.currency,
    shortLabel: quote.shortLabel,
    name: quote.name,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    previousClose: quote.previousClose,
    volume: quote.volume,
    averageVolume: quote.averageVolume,
  };
}

/** Prefer next-intl locale; fall back to URL pathname segment. */
export function useAISummaryLocale(): AISummaryLocale {
  const intlLocale = useLocale();
  const pathname = usePathname();

  return useMemo(() => {
    const fromIntl = normalizeAISummaryLocale(intlLocale);
    if (fromIntl === "zh") return "zh";
    const fromPath = localeFromPathname(pathname ?? "");
    return fromPath === "zh" ? "zh" : fromIntl;
  }, [intlLocale, pathname]);
}

export function useAIMarketSummary({
  symbol,
  market,
  quote,
  candles,
  enabled = true,
}: UseAIMarketSummaryOptions) {
  const locale = useAISummaryLocale();
  const t = useTranslations("aiSummary");
  const [data, setData] = useState<MarketSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);
  const quoteRef = useRef(quote);
  const candlesRef = useRef(candles);
  const localeRef = useRef(locale);

  quoteRef.current = quote;
  candlesRef.current = candles;
  localeRef.current = locale;

  const candleFingerprint = useMemo(() => {
    if (candles.length < 2) return "";
    const last = candles[candles.length - 1];
    return `${candles.length}:${last.time}:${last.close}`;
  }, [candles]);

  const requestKey = useMemo(
    () =>
      symbol && enabled
        ? `${symbol}|${market}|${locale}|${candleFingerprint}`
        : "",
    [symbol, market, locale, candleFingerprint, enabled]
  );

  const cooldownSeconds = useMemo(() => {
    void tick;
    const left = Math.ceil((cooldownUntil - Date.now()) / 1000);
    return left > 0 ? left : 0;
  }, [cooldownUntil, tick]);

  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  useEffect(() => {
    setData(null);
    setLoading(false);
    abortRef.current?.abort();
    inFlightKeyRef.current = null;
    requestIdRef.current += 1;
  }, [symbol, market, locale]);

  const fetchSummary = useCallback(
    async (refresh = false) => {
      if (!symbol || !enabled || candlesRef.current.length < 2) {
        setData(null);
        setLoading(false);
        return;
      }

      const activeLocale = localeRef.current;
      const flightKey = `${symbol}|${market}|${activeLocale}|${refresh ? "r" : "a"}`;
      if (inFlightKeyRef.current === flightKey) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;
      inFlightKeyRef.current = flightKey;

      setLoading(true);

      try {
        const bars = candlesRef.current;
        const indicators = buildIndicatorsFromCandles(bars);
        const res = await fetch(
          `/api/ai/market-summary${refresh ? "?refresh=1" : ""}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-FMF-Locale": activeLocale,
              "Accept-Language": activeLocale === "zh" ? "zh-CN,zh" : "en",
              ...(refresh ? { "X-Skip-Cache": "1" } : {}),
            },
            signal: controller.signal,
            body: JSON.stringify({
              symbol,
              market,
              locale: activeLocale,
              quote: quoteToInputFixed(quoteRef.current),
              candles: slimCandles(bars, 60),
              indicators,
            }),
          }
        );

        const json = (await res.json()) as MarketSummaryResponse;
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setData(json);
      } catch {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setData({
          summary: "",
          sentiment: "neutral",
          highlights: [],
          unavailable: true,
          message: t("unavailable"),
        });
      } finally {
        if (inFlightKeyRef.current === flightKey) {
          inFlightKeyRef.current = null;
        }
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [symbol, market, enabled, t]
  );

  useEffect(() => {
    if (!requestKey) {
      setData(null);
      setLoading(false);
      return;
    }
    void fetchSummary(false);
    return () => abortRef.current?.abort();
  }, [requestKey, fetchSummary]);

  const refresh = useCallback(() => {
    if (cooldownSeconds > 0 || loading || !symbol) return;
    setCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS);
    void fetchSummary(true);
  }, [cooldownSeconds, loading, symbol, fetchSummary]);

  return {
    data,
    loading,
    refresh,
    locale,
    canRefresh: Boolean(symbol) && cooldownSeconds === 0 && !loading,
    cooldownSeconds,
  };
}
