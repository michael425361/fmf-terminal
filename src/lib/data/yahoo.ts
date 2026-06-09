import "server-only";

import YahooFinance from "yahoo-finance2";
import { normalizeYahooSymbol } from "@/lib/market-data/symbol-normalize";

/**
 * Yahoo Finance fundamentals client.
 *
 * Wraps `yahoo-finance2` `quoteSummary` to provide the company profile,
 * valuation, financials, analyst and earnings data the AI context engine needs.
 * Node-only (the upstream library relies on Node built-ins); AI route handlers
 * run on the Node.js runtime by default.
 */

let client: InstanceType<typeof YahooFinance> | null = null;

function getClient() {
  if (!client) client = new YahooFinance();
  return client;
}

export interface YahooCompanyProfile {
  name?: string;
  sector?: string;
  industry?: string;
  country?: string;
  website?: string;
  summary?: string;
  fullTimeEmployees?: number;
}

export interface YahooValuation {
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  priceToSales?: number;
  pegRatio?: number;
  enterpriseToEbitda?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface YahooFinancials {
  totalRevenue?: number;
  revenueGrowth?: number;
  grossMargins?: number;
  operatingMargins?: number;
  profitMargins?: number;
  ebitda?: number;
  freeCashflow?: number;
  totalCash?: number;
  totalDebt?: number;
  returnOnEquity?: number;
  recommendationKey?: string;
  recommendationMean?: number;
  numberOfAnalystOpinions?: number;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  currentPrice?: number;
}

export interface YahooEarningsQuarter {
  date?: string;
  actual?: number;
  estimate?: number;
}

export interface YahooEarnings {
  quarterly: YahooEarningsQuarter[];
  lastEpsActual?: number;
  lastEpsEstimate?: number;
  nextEarningsDate?: string;
}

export interface YahooFundamentals {
  symbol: string;
  profile: YahooCompanyProfile;
  valuation: YahooValuation;
  financials: YahooFinancials;
  earnings: YahooEarnings;
}

interface QuoteSummaryShape {
  assetProfile?: {
    sector?: string;
    industry?: string;
    country?: string;
    website?: string;
    longBusinessSummary?: string;
    fullTimeEmployees?: number;
  };
  price?: { longName?: string; shortName?: string; marketCap?: number };
  summaryDetail?: {
    trailingPE?: number;
    forwardPE?: number;
    priceToSalesTrailing12Months?: number;
    dividendYield?: number;
    beta?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    marketCap?: number;
  };
  defaultKeyStatistics?: {
    forwardPE?: number;
    priceToBook?: number;
    pegRatio?: number;
    enterpriseToEbitda?: number;
    beta?: number;
  };
  financialData?: {
    totalRevenue?: number;
    revenueGrowth?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    ebitda?: number;
    freeCashflow?: number;
    totalCash?: number;
    totalDebt?: number;
    returnOnEquity?: number;
    recommendationKey?: string;
    recommendationMean?: number;
    numberOfAnalystOpinions?: number;
    targetMeanPrice?: number;
    targetHighPrice?: number;
    targetLowPrice?: number;
    currentPrice?: number;
  };
  earnings?: {
    earningsChart?: {
      quarterly?: Array<{ date?: string; actual?: number; estimate?: number }>;
    };
  };
  earningsHistory?: {
    history?: Array<{
      quarter?: Date | string;
      epsActual?: number;
      epsEstimate?: number;
    }>;
  };
  calendarEvents?: {
    earnings?: { earningsDate?: Array<Date | string> };
  };
}

function toIso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

export async function getYahooFundamentals(
  symbol: string
): Promise<YahooFundamentals | null> {
  const yahooSymbol = normalizeYahooSymbol(symbol);

  // The yahoo-finance2 module-name union is strict; wrap in a tolerant
  // signature so we depend only on the runtime behavior, not exact literals.
  type QuoteSummaryFn = (
    symbol: string,
    opts: { modules: string[] }
  ) => Promise<unknown>;
  const quoteSummary = getClient().quoteSummary.bind(
    getClient()
  ) as unknown as QuoteSummaryFn;

  let summary: QuoteSummaryShape;
  try {
    summary = (await quoteSummary(yahooSymbol, {
      modules: [
        "assetProfile",
        "price",
        "summaryDetail",
        "defaultKeyStatistics",
        "financialData",
        "earnings",
        "earningsHistory",
        "calendarEvents",
      ],
    })) as QuoteSummaryShape;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[data/yahoo] quoteSummary failed:",
        yahooSymbol,
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }

  const ap = summary.assetProfile ?? {};
  const sd = summary.summaryDetail ?? {};
  const ks = summary.defaultKeyStatistics ?? {};
  const fd = summary.financialData ?? {};

  const profile: YahooCompanyProfile = {
    name: summary.price?.longName ?? summary.price?.shortName,
    sector: ap.sector,
    industry: ap.industry,
    country: ap.country,
    website: ap.website,
    summary: ap.longBusinessSummary,
    fullTimeEmployees: ap.fullTimeEmployees,
  };

  const valuation: YahooValuation = {
    marketCap: summary.price?.marketCap ?? sd.marketCap,
    trailingPE: sd.trailingPE,
    forwardPE: sd.forwardPE ?? ks.forwardPE,
    priceToBook: ks.priceToBook,
    priceToSales: sd.priceToSalesTrailing12Months,
    pegRatio: ks.pegRatio,
    enterpriseToEbitda: ks.enterpriseToEbitda,
    dividendYield: sd.dividendYield,
    beta: sd.beta ?? ks.beta,
    fiftyTwoWeekHigh: sd.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: sd.fiftyTwoWeekLow,
  };

  const financials: YahooFinancials = {
    totalRevenue: fd.totalRevenue,
    revenueGrowth: fd.revenueGrowth,
    grossMargins: fd.grossMargins,
    operatingMargins: fd.operatingMargins,
    profitMargins: fd.profitMargins,
    ebitda: fd.ebitda,
    freeCashflow: fd.freeCashflow,
    totalCash: fd.totalCash,
    totalDebt: fd.totalDebt,
    returnOnEquity: fd.returnOnEquity,
    recommendationKey: fd.recommendationKey,
    recommendationMean: fd.recommendationMean,
    numberOfAnalystOpinions: fd.numberOfAnalystOpinions,
    targetMeanPrice: fd.targetMeanPrice,
    targetHighPrice: fd.targetHighPrice,
    targetLowPrice: fd.targetLowPrice,
    currentPrice: fd.currentPrice,
  };

  const quarterlyChart = summary.earnings?.earningsChart?.quarterly ?? [];
  const history = summary.earningsHistory?.history ?? [];

  const quarterly: YahooEarningsQuarter[] = history.length
    ? history.map((h) => ({
        date: toIso(h.quarter),
        actual: h.epsActual,
        estimate: h.epsEstimate,
      }))
    : quarterlyChart.map((q) => ({
        date: q.date,
        actual: q.actual,
        estimate: q.estimate,
      }));

  const lastHistory = history[history.length - 1];
  const nextEarnings = summary.calendarEvents?.earnings?.earningsDate?.[0];

  const earnings: YahooEarnings = {
    quarterly,
    lastEpsActual: lastHistory?.epsActual,
    lastEpsEstimate: lastHistory?.epsEstimate,
    nextEarningsDate: toIso(nextEarnings),
  };

  return { symbol: yahooSymbol, profile, valuation, financials, earnings };
}
