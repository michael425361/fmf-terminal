import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FinancialContext } from "./context-engine";

vi.mock("@/lib/ai/model-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./model-router")>();
  return { ...actual, generateAIResponse: vi.fn() };
});

import { generateResearchReport } from "./research-report";
import { generateAIResponse } from "./model-router";

const mockGenerate = vi.mocked(generateAIResponse);

function makeContext(): FinancialContext {
  return {
    ticker: "AAPL",
    companyProfile: {
      name: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "US",
      employees: 160000,
    },
    valuationMetrics: { trailingPE: 30, forwardPE: 28 },
    earningsData: {
      quarterly: [{ date: "2025-12-31", actual: 2.1, estimate: 2.0 }],
      surprises: [
        { actual: 2.1, estimate: 2.0, period: "2025-12-31", surprise: 0.1, surprisePercent: 5 },
      ],
      lastEpsActual: 2.1,
      lastEpsEstimate: 2.0,
      nextEarningsDate: "2026-04-30T00:00:00.000Z",
    },
    analystRatings: { recommendationKey: "buy", targetMeanPrice: 220 },
    marketEnvironment: {
      trend: "bullish",
      breadth: 0.5,
      indices: [{ symbol: "SPY", label: "S&P 500", changePercent: 0.8 }],
      sectors: [],
      topSector: { symbol: "XLK", label: "Technology", changePercent: 1.2 },
      bottomSector: { symbol: "XLU", label: "Utilities", changePercent: -0.3 },
      asOf: Date.now(),
    },
    technicalTrend: {
      price: 150,
      changePercent: 1.5,
      positionInRange: 0.5,
      trend: "up",
    },
    newsSummary: { summary: "ok", sentiment: "bullish", themes: [] },
    recentNews: [
      {
        title: "Apple ships record iPhones",
        summary: "x",
        source: "Reuters",
        publishedAt: "2026-01-05T00:00:00.000Z",
        url: "https://a",
      },
    ],
    generatedAt: Date.now(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateResearchReport", () => {
  it("produces a structured, evidence-grounded report", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        executiveSummary: "Apple is well positioned.",
        bullCase: "Strong ecosystem and services growth.",
        bearCase: "Hardware demand cyclicality.",
        risks: "China exposure, valuation.",
        catalysts: "Q2 earnings, new product cycle.",
        valuationView: "Premium multiple vs peers.",
        confidence: 72,
      }),
      model: "gpt-5",
      usedFallback: false,
    });

    const report = await generateResearchReport("aapl", {
      locale: "en",
      context: makeContext(),
    });

    expect(report.ticker).toBe("AAPL");
    expect(report.model).toBe("gpt-5");
    expect(report.bullCase).toContain("ecosystem");
    expect(report.bearCase).toContain("cyclicality");
    expect(report.confidence).toBe(72);
  });

  it("clamps out-of-range confidence", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        executiveSummary: "s",
        bullCase: "b",
        bearCase: "be",
        risks: "r",
        catalysts: "c",
        valuationView: "v",
        confidence: 250,
      }),
      model: "gpt-5",
      usedFallback: false,
    });
    const report = await generateResearchReport("AAPL", {
      context: makeContext(),
    });
    expect(report.confidence).toBe(100);
  });

  it("throws when the model output is missing required fields", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({ executiveSummary: "only summary" }),
      model: "gpt-5",
      usedFallback: false,
    });
    await expect(
      generateResearchReport("AAPL", { context: makeContext() })
    ).rejects.toThrow(/parse failed/);
  });
});
