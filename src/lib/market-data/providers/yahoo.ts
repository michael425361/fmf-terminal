import "server-only";

import YahooFinance from "yahoo-finance2";
import type { CandleProvider, ProviderCandleResult, ProviderFetchContext } from "./types";
import { getYahooChartSymbolCandidates } from "../symbol-normalize";
import { quotesToBars, withRetries, withTimeout } from "./shared";

let yahooClient: InstanceType<typeof YahooFinance> | null = null;

function getClient() {
  if (!yahooClient) {
    yahooClient = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  }
  return yahooClient;
}

async function fetchOne(
  yahooSymbol: string,
  ctx: ProviderFetchContext
): Promise<ProviderCandleResult | null> {
  const yf = getClient();
  const period1 = new Date(Date.now() - ctx.fetchDays * 24 * 60 * 60 * 1000);
  const period2 = new Date();
  const result = (await yf.chart(
    yahooSymbol,
    {
      period1,
      period2,
      interval: ctx.interval as "5m",
      includePrePost: ctx.includePrePost && ctx.market === "us" ? true : false,
    },
    { validateResult: false }
  )) as {
    quotes?: Array<{
      date?: Date | null;
      open?: number | null;
      high?: number | null;
      low?: number | null;
      close?: number | null;
      volume?: number | null;
    }>;
    meta?: { exchangeTimezoneName?: string; symbol?: string };
  };

  const bars = quotesToBars(result.quotes ?? []);
  if (bars.length < 2) return null;

  return {
    provider: "yahoo",
    symbol: yahooSymbol,
    bars,
    timezone: result.meta?.exchangeTimezoneName,
  };
}

export const yahooProvider: CandleProvider = {
  id: "yahoo",
  async fetch(ctx) {
    const candidates = getYahooChartSymbolCandidates(ctx.symbol);
    const fetchSteps = [
      ctx.fetchDays,
      Math.max(ctx.fetchDays, 10),
      Math.max(ctx.fetchDays, 15),
    ];
    const uniqueDays = [...new Set(fetchSteps)];

    for (const yahooSymbol of candidates) {
      for (const fetchDays of uniqueDays) {
        try {
          const result = await withRetries(
            () =>
              withTimeout(fetchOne(yahooSymbol, { ...ctx, fetchDays })),
            2,
            "yahoo"
          );
          if (result) return result;
        } catch (err) {
          console.warn("[provider:yahoo] failed", {
            symbol: yahooSymbol,
            error: err instanceof Error ? err.message : err,
          });
        }
      }
    }
    return null;
  },
};
