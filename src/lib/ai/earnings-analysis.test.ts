import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FinancialContext } from "./context-engine";

vi.mock("@/lib/ai/model-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./model-router")>();
  return { ...actual, generateAIResponse: vi.fn() };
});

import { analyzeEarnings, detectVerdict } from "./earnings-analysis";
import { generateAIResponse } from "./model-router";

const mockGenerate = vi.mocked(generateAIResponse);

function makeContext(
  overrides: Partial<FinancialContext["earningsData"]> = {}
): FinancialContext {
  return {
    ticker: "AAPL",
    companyProfile: { name: "Apple Inc.", sector: "Technology" },
    valuationMetrics: { trailingPE: 30 },
    earningsData: {
      quarterly: [{ date: "2025-12-31", actual: 2.1, estimate: 2.0 }],
      surprises: [
        { actual: 2.1, estimate: 2.0, period: "2025-12-31", surprise: 0.1, surprisePercent: 5 },
      ],
      lastEpsActual: 2.1,
      lastEpsEstimate: 2.0,
      nextEarningsDate: "2026-04-30T00:00:00.000Z",
      ...overrides,
    },
    analystRatings: { recommendationKey: "buy" },
    marketEnvironment: {
      trend: "neutral",
      breadth: 0,
      indices: [],
      sectors: [],
      topSector: null,
      bottomSector: null,
      asOf: Date.now(),
    },
    technicalTrend: { positionInRange: null, trend: "flat" },
    newsSummary: null,
    recentNews: [],
    generatedAt: Date.now(),
  };
}

describe("detectVerdict", () => {
  it("detects beats, meets and misses", () => {
    expect(detectVerdict(2.2, 2.0)).toBe("beat");
    expect(detectVerdict(2.0, 2.0)).toBe("meet");
    expect(detectVerdict(1.5, 2.0)).toBe("miss");
  });

  it("treats small deviations within tolerance as a meet", () => {
    expect(detectVerdict(2.01, 2.0)).toBe("meet");
  });

  it("handles zero and missing estimates", () => {
    expect(detectVerdict(0.5, 0)).toBe("beat");
    expect(detectVerdict(0, 0)).toBe("meet");
    expect(detectVerdict(-0.2, 0)).toBe("miss");
    expect(detectVerdict(null, 2.0)).toBe("unknown");
    expect(detectVerdict(2.0, undefined)).toBe("unknown");
  });
});

describe("analyzeEarnings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("computes the EPS verdict and parses the model assessment", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        revenueAssessment: "Revenue grew double digits.",
        epsAssessment: "EPS beat by 5%.",
        guidanceAssessment: "Guidance raised.",
        positives: "Services momentum.",
        negatives: "China softness.",
        keyTakeaways: "Solid quarter overall.",
        confidence: 80,
      }),
      model: "gpt-5",
      usedFallback: false,
    });

    const result = await analyzeEarnings("aapl", { context: makeContext() });

    expect(result.epsVerdict).toBe("beat");
    expect(result.epsSurprisePercent).toBe(5);
    expect(result.epsAssessment).toContain("beat");
    expect(result.confidence).toBe(80);
    expect(result.model).toBe("gpt-5");
  });

  it("reports an unknown verdict when EPS data is absent", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        epsAssessment: "No EPS data available.",
        keyTakeaways: "Limited visibility.",
        confidence: 30,
      }),
      model: "gpt-5",
      usedFallback: false,
    });

    const ctx = makeContext({
      surprises: [],
      lastEpsActual: undefined,
      lastEpsEstimate: undefined,
    });
    const result = await analyzeEarnings("AAPL", { context: ctx });
    expect(result.epsVerdict).toBe("unknown");
  });
});
