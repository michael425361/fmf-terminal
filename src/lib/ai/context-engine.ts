import type { AISummaryLocale } from "./locale";
import {
  getCompanyNews,
  summarizeNews,
  type NewsItem,
  type NewsSummary,
} from "./news-intelligence";
import {
  fetchFinnhubEarnings,
  fetchFinnhubProfile,
  fetchFinnhubQuote,
  fetchFinnhubRecommendations,
  type FinnhubEarningSurprise,
  type FinnhubRecommendation,
} from "@/lib/data/finnhub";
import {
  getMarketEnvironment,
  type MarketEnvironment,
} from "@/lib/data/market-context";
import { getYahooFundamentals } from "@/lib/data/yahoo";

/**
 * Financial Context Engine (Phase 3).
 *
 * Aggregates every data source into a single {@link FinancialContext}. No AI
 * analysis (explain-move, research, earnings) should ever call the model
 * without first building this context.
 */

export interface ContextCompanyProfile {
  name?: string;
  sector?: string;
  industry?: string;
  country?: string;
  website?: string;
  description?: string;
  employees?: number;
}

export interface ContextValuation {
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

export interface ContextEarnings {
  quarterly: Array<{ date?: string; actual?: number; estimate?: number }>;
  surprises: FinnhubEarningSurprise[];
  lastEpsActual?: number;
  lastEpsEstimate?: number;
  nextEarningsDate?: string;
}

export interface ContextAnalystRatings {
  recommendationKey?: string;
  recommendationMean?: number;
  numberOfAnalystOpinions?: number;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  latestTrend?: FinnhubRecommendation | null;
}

export interface ContextTechnicalTrend {
  price?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  /** 0-1 position within the 52-week range, null when unknown. */
  positionInRange: number | null;
  trend: "up" | "down" | "flat";
}

export interface FinancialContext {
  ticker: string;
  companyProfile: ContextCompanyProfile;
  valuationMetrics: ContextValuation;
  earningsData: ContextEarnings;
  analystRatings: ContextAnalystRatings;
  marketEnvironment: MarketEnvironment;
  technicalTrend: ContextTechnicalTrend;
  newsSummary: NewsSummary | null;
  recentNews: NewsItem[];
  generatedAt: number;
}

export interface BuildContextOptions {
  locale?: AISummaryLocale;
  /** Run an AI news summary inside the context (default true). */
  includeNewsSummary?: boolean;
  /** Trailing window for company news. */
  newsDays?: number;
}

function computeTechnicalTrend(
  quote: Awaited<ReturnType<typeof fetchFinnhubQuote>>,
  valuation: ContextValuation
): ContextTechnicalTrend {
  const price = quote?.c;
  const changePercent = quote?.dp;
  const high = valuation.fiftyTwoWeekHigh;
  const low = valuation.fiftyTwoWeekLow;

  let positionInRange: number | null = null;
  if (price != null && high != null && low != null && high > low) {
    positionInRange = Number(((price - low) / (high - low)).toFixed(2));
  }

  let trend: ContextTechnicalTrend["trend"] = "flat";
  if (typeof changePercent === "number") {
    if (changePercent > 0.25) trend = "up";
    else if (changePercent < -0.25) trend = "down";
  }

  return {
    price,
    changePercent,
    dayHigh: quote?.h,
    dayLow: quote?.l,
    previousClose: quote?.pc,
    fiftyTwoWeekHigh: high,
    fiftyTwoWeekLow: low,
    positionInRange,
    trend,
  };
}

/**
 * Build the full financial context for a ticker. Every source degrades
 * gracefully, so a partial context is returned rather than throwing when an
 * upstream provider is unavailable.
 */
export async function buildFinancialContext(
  ticker: string,
  options: BuildContextOptions = {}
): Promise<FinancialContext> {
  const { locale = "en", includeNewsSummary = true, newsDays = 14 } = options;
  const symbol = ticker.trim().toUpperCase();

  const [
    fundamentals,
    finnhubProfile,
    recommendations,
    earningsSurprises,
    quote,
    marketEnvironment,
    recentNews,
  ] = await Promise.all([
    getYahooFundamentals(symbol),
    fetchFinnhubProfile(symbol),
    fetchFinnhubRecommendations(symbol),
    fetchFinnhubEarnings(symbol),
    fetchFinnhubQuote(symbol),
    getMarketEnvironment(),
    getCompanyNews(symbol, { days: newsDays, limit: 12 }),
  ]);

  const companyProfile: ContextCompanyProfile = {
    name: fundamentals?.profile.name ?? finnhubProfile?.name,
    sector: fundamentals?.profile.sector ?? finnhubProfile?.finnhubIndustry,
    industry: fundamentals?.profile.industry ?? finnhubProfile?.finnhubIndustry,
    country: fundamentals?.profile.country ?? finnhubProfile?.country,
    website: fundamentals?.profile.website ?? finnhubProfile?.weburl,
    description: fundamentals?.profile.summary,
    employees: fundamentals?.profile.fullTimeEmployees,
  };

  const valuationMetrics: ContextValuation = {
    marketCap:
      fundamentals?.valuation.marketCap ??
      (finnhubProfile?.marketCapitalization
        ? finnhubProfile.marketCapitalization * 1_000_000
        : undefined),
    trailingPE: fundamentals?.valuation.trailingPE,
    forwardPE: fundamentals?.valuation.forwardPE,
    priceToBook: fundamentals?.valuation.priceToBook,
    priceToSales: fundamentals?.valuation.priceToSales,
    pegRatio: fundamentals?.valuation.pegRatio,
    enterpriseToEbitda: fundamentals?.valuation.enterpriseToEbitda,
    dividendYield: fundamentals?.valuation.dividendYield,
    beta: fundamentals?.valuation.beta,
    fiftyTwoWeekHigh: fundamentals?.valuation.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: fundamentals?.valuation.fiftyTwoWeekLow,
  };

  const earningsData: ContextEarnings = {
    quarterly: fundamentals?.earnings.quarterly ?? [],
    surprises: earningsSurprises.slice(0, 6),
    lastEpsActual: fundamentals?.earnings.lastEpsActual,
    lastEpsEstimate: fundamentals?.earnings.lastEpsEstimate,
    nextEarningsDate: fundamentals?.earnings.nextEarningsDate,
  };

  const analystRatings: ContextAnalystRatings = {
    recommendationKey: fundamentals?.financials.recommendationKey,
    recommendationMean: fundamentals?.financials.recommendationMean,
    numberOfAnalystOpinions: fundamentals?.financials.numberOfAnalystOpinions,
    targetMeanPrice: fundamentals?.financials.targetMeanPrice,
    targetHighPrice: fundamentals?.financials.targetHighPrice,
    targetLowPrice: fundamentals?.financials.targetLowPrice,
    latestTrend: recommendations[0] ?? null,
  };

  const technicalTrend = computeTechnicalTrend(quote, valuationMetrics);

  let newsSummary: NewsSummary | null = null;
  if (includeNewsSummary && recentNews.length > 0) {
    try {
      newsSummary = await summarizeNews(recentNews, { ticker: symbol, locale });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[context-engine] news summary failed:",
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  return {
    ticker: symbol,
    companyProfile,
    valuationMetrics,
    earningsData,
    analystRatings,
    marketEnvironment,
    technicalTrend,
    newsSummary,
    recentNews: recentNews.slice(0, 8),
    generatedAt: Date.now(),
  };
}

/** Trim a context into a compact JSON payload for prompt token efficiency. */
export function serializeContextForPrompt(ctx: FinancialContext) {
  return {
    ticker: ctx.ticker,
    companyProfile: {
      name: ctx.companyProfile.name,
      sector: ctx.companyProfile.sector,
      industry: ctx.companyProfile.industry,
      country: ctx.companyProfile.country,
      employees: ctx.companyProfile.employees,
    },
    valuation: ctx.valuationMetrics,
    earnings: {
      lastEpsActual: ctx.earningsData.lastEpsActual,
      lastEpsEstimate: ctx.earningsData.lastEpsEstimate,
      nextEarningsDate: ctx.earningsData.nextEarningsDate,
      recentQuarters: ctx.earningsData.quarterly.slice(-4),
      surprises: ctx.earningsData.surprises.slice(0, 4),
    },
    analystRatings: ctx.analystRatings,
    marketEnvironment: {
      trend: ctx.marketEnvironment.trend,
      breadth: ctx.marketEnvironment.breadth,
      indices: ctx.marketEnvironment.indices,
      topSector: ctx.marketEnvironment.topSector,
      bottomSector: ctx.marketEnvironment.bottomSector,
    },
    technicalTrend: ctx.technicalTrend,
    newsSummary: ctx.newsSummary,
    topHeadlines: ctx.recentNews.slice(0, 6).map((n) => ({
      title: n.title,
      source: n.source,
      publishedAt: n.publishedAt,
    })),
  };
}
