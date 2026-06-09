import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FinancialContext } from "./context-engine";

vi.mock("@/lib/ai/model-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./model-router")>();
  return { ...actual, generateAIResponse: vi.fn() };
});

import { explainMove } from "./explain-move";
import { generateAIResponse } from "./model-router";

const mockGenerate = vi.mocked(generateAIResponse);

function makeContext(): FinancialContext {
  return {
    ticker: "NVDA",
    companyProfile: { name: "NVIDIA", sector: "Technology" },
    valuationMetrics: { forwardPE: 35 },
    earningsData: { quarterly: [], surprises: [] },
    analystRatings: { recommendationKey: "strong_buy" },
    marketEnvironment: {
      trend: "bullish",
      breadth: 0.7,
      indices: [],
      sectors: [],
      topSector: null,
      bottomSector: null,
      asOf: Date.now(),
    },
    technicalTrend: { price: 900, changePercent: 8.7, positionInRange: 0.95, trend: "up" },
    newsSummary: { summary: "Data center demand surges.", sentiment: "bullish", themes: [] },
    recentNews: [],
    generatedAt: Date.now(),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("explainMove", () => {
  it("returns a grounded explanation with parsed catalysts and confidence", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        headline:
          "NVIDIA rose 8.7% after stronger-than-expected data center revenue.",
        explanation: "The move was driven by upbeat guidance and analyst upgrades.",
        confidence: 84,
        catalysts: "Data center revenue beat, analyst upgrades, sector strength",
      }),
      model: "gpt-4.1-mini",
      usedFallback: false,
    });

    const result = await explainMove(
      { ticker: "nvda", priceChange: 8.7, volumeChange: 60 },
      { locale: "en", context: makeContext() }
    );

    expect(result.ticker).toBe("NVDA");
    expect(result.headline).toContain("8.7%");
    expect(result.confidence).toBe(84);
    expect(result.catalysts).toContain("analyst upgrades");
  });

  it("throws when required fields are missing", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({ headline: "only headline" }),
      model: "gpt-4.1-mini",
      usedFallback: false,
    });
    await expect(
      explainMove(
        { ticker: "NVDA", priceChange: 1, volumeChange: 0 },
        { context: makeContext() }
      )
    ).rejects.toThrow(/parse failed/);
  });
});
