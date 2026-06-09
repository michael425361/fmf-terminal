import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/yahoo", () => ({ getYahooFundamentals: vi.fn() }));
vi.mock("@/lib/data/market-context", () => ({ getMarketEnvironment: vi.fn() }));
vi.mock("@/lib/data/finnhub", () => ({
  fetchFinnhubProfile: vi.fn(),
  fetchFinnhubRecommendations: vi.fn(),
  fetchFinnhubEarnings: vi.fn(),
  fetchFinnhubQuote: vi.fn(),
}));
vi.mock("./news-intelligence", () => ({
  getCompanyNews: vi.fn(),
  summarizeNews: vi.fn(),
}));

import {
  buildFinancialContext,
  serializeContextForPrompt,
} from "./context-engine";
import { getYahooFundamentals } from "@/lib/data/yahoo";
import { getMarketEnvironment } from "@/lib/data/market-context";
import {
  fetchFinnhubEarnings,
  fetchFinnhubProfile,
  fetchFinnhubQuote,
  fetchFinnhubRecommendations,
} from "@/lib/data/finnhub";
import { getCompanyNews, summarizeNews } from "./news-intelligence";

const mockYahoo = vi.mocked(getYahooFundamentals);
const mockEnv = vi.mocked(getMarketEnvironment);
const mockProfile = vi.mocked(fetchFinnhubProfile);
const mockRecs = vi.mocked(fetchFinnhubRecommendations);
const mockEarnings = vi.mocked(fetchFinnhubEarnings);
const mockQuote = vi.mocked(fetchFinnhubQuote);
const mockCompanyNews = vi.mocked(getCompanyNews);
const mockSummarize = vi.mocked(summarizeNews);

beforeEach(() => {
  vi.clearAllMocks();

  mockYahoo.mockResolvedValue({
    symbol: "AAPL",
    profile: { name: "Apple Inc.", sector: "Technology", industry: "Consumer Electronics" },
    valuation: { trailingPE: 30, forwardPE: 28, fiftyTwoWeekHigh: 200, fiftyTwoWeekLow: 100 },
    financials: {
      recommendationKey: "buy",
      targetMeanPrice: 220,
      numberOfAnalystOpinions: 40,
    },
    earnings: {
      quarterly: [{ date: "2025-12-31", actual: 2.1, estimate: 2.0 }],
      lastEpsActual: 2.1,
      lastEpsEstimate: 2.0,
      nextEarningsDate: "2026-04-30T00:00:00.000Z",
    },
  });
  mockEnv.mockResolvedValue({
    trend: "bullish",
    breadth: 0.6,
    indices: [{ symbol: "SPY", label: "S&P 500", changePercent: 0.8 }],
    sectors: [{ symbol: "XLK", label: "Technology", changePercent: 1.2 }],
    topSector: { symbol: "XLK", label: "Technology", changePercent: 1.2 },
    bottomSector: { symbol: "XLU", label: "Utilities", changePercent: -0.4 },
    asOf: Date.now(),
  });
  mockProfile.mockResolvedValue(null);
  mockRecs.mockResolvedValue([
    { buy: 20, hold: 10, sell: 1, strongBuy: 9, strongSell: 0, period: "2026-01-01", symbol: "AAPL" },
  ]);
  mockEarnings.mockResolvedValue([
    { actual: 2.1, estimate: 2.0, period: "2025-12-31", surprise: 0.1, surprisePercent: 5 },
  ]);
  mockQuote.mockResolvedValue({ c: 150, dp: 1.5, h: 152, l: 148, pc: 147.8 });
  mockCompanyNews.mockResolvedValue([
    {
      title: "Apple ships record iPhones",
      summary: "demand strong",
      source: "Reuters",
      publishedAt: "2026-01-05T00:00:00.000Z",
      url: "https://a",
    },
  ]);
  mockSummarize.mockResolvedValue({
    summary: "Constructive flow.",
    sentiment: "bullish",
    themes: ["Strong Demand"],
  });
});

describe("buildFinancialContext", () => {
  it("merges all sources into a complete context", async () => {
    const ctx = await buildFinancialContext("aapl", { locale: "en" });

    expect(ctx.ticker).toBe("AAPL");
    expect(ctx.companyProfile.name).toBe("Apple Inc.");
    expect(ctx.valuationMetrics.trailingPE).toBe(30);
    expect(ctx.analystRatings.recommendationKey).toBe("buy");
    expect(ctx.analystRatings.latestTrend?.buy).toBe(20);
    expect(ctx.earningsData.surprises).toHaveLength(1);
    expect(ctx.marketEnvironment.trend).toBe("bullish");
    expect(ctx.newsSummary?.summary).toBe("Constructive flow.");
    expect(ctx.recentNews).toHaveLength(1);
  });

  it("computes technical trend position-in-range and direction", async () => {
    const ctx = await buildFinancialContext("AAPL");
    // (150 - 100) / (200 - 100) = 0.5
    expect(ctx.technicalTrend.positionInRange).toBe(0.5);
    expect(ctx.technicalTrend.trend).toBe("up");
  });

  it("skips the AI news summary when disabled", async () => {
    const ctx = await buildFinancialContext("AAPL", { includeNewsSummary: false });
    expect(ctx.newsSummary).toBeNull();
    expect(mockSummarize).not.toHaveBeenCalled();
  });

  it("degrades gracefully when fundamentals are missing", async () => {
    mockYahoo.mockResolvedValue(null);
    mockQuote.mockResolvedValue(null);
    const ctx = await buildFinancialContext("AAPL");
    expect(ctx.companyProfile.name).toBeUndefined();
    expect(ctx.technicalTrend.positionInRange).toBeNull();
    expect(ctx.technicalTrend.trend).toBe("flat");
  });
});

describe("serializeContextForPrompt", () => {
  it("produces a trimmed payload for prompts", async () => {
    const ctx = await buildFinancialContext("AAPL");
    const payload = serializeContextForPrompt(ctx);
    expect(payload.ticker).toBe("AAPL");
    expect(payload.marketEnvironment.trend).toBe("bullish");
    expect(payload.topHeadlines[0].title).toBe("Apple ships record iPhones");
    expect(payload.companyProfile.name).toBe("Apple Inc.");
  });
});
