import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/finnhub", () => ({
  fetchFinnhubCompanyNews: vi.fn(),
  fetchFinnhubMarketNews: vi.fn(),
}));

vi.mock("@/lib/ai/model-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./model-router")>();
  return { ...actual, generateAIResponse: vi.fn() };
});

import {
  applyRankings,
  getCompanyNews,
  rankNews,
  summarizeNews,
  type NewsItem,
} from "./news-intelligence";
import { generateAIResponse } from "./model-router";
import {
  fetchFinnhubCompanyNews,
  fetchFinnhubMarketNews,
} from "@/lib/data/finnhub";

const mockGenerate = vi.mocked(generateAIResponse);
const mockCompanyNews = vi.mocked(fetchFinnhubCompanyNews);
const mockMarketNews = vi.mocked(fetchFinnhubMarketNews);

const items: NewsItem[] = [
  {
    title: "Alpha beats earnings",
    summary: "s1",
    source: "Reuters",
    publishedAt: "2026-01-02T00:00:00.000Z",
    url: "https://a",
  },
  {
    title: "Beta routine note",
    summary: "s2",
    source: "Bloomberg",
    publishedAt: "2026-01-01T00:00:00.000Z",
    url: "https://b",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("applyRankings", () => {
  it("computes importance x relevance and sorts descending", () => {
    const ranked = applyRankings(items, [
      { index: 0, relevanceScore: 90, importance: 80, sentiment: "bullish" },
      { index: 1, relevanceScore: 40, importance: 30, sentiment: "neutral" },
    ]);
    expect(ranked[0].title).toBe("Alpha beats earnings");
    expect(ranked[0].score).toBe(72); // round(90*80/100)
    expect(ranked[1].score).toBe(12); // round(40*30/100)
    expect(ranked[0].sentiment).toBe("bullish");
  });

  it("clamps out-of-range scores and defaults missing indices", () => {
    const ranked = applyRankings(items, [
      { index: 0, relevanceScore: 150, importance: -5, sentiment: "weird" as never },
    ]);
    const alpha = ranked.find((r) => r.title === "Alpha beats earnings")!;
    const beta = ranked.find((r) => r.title === "Beta routine note")!;
    expect(alpha.relevanceScore).toBe(100);
    expect(alpha.importance).toBe(0);
    expect(alpha.sentiment).toBe("neutral");
    expect(beta.score).toBe(0);
  });
});

describe("getCompanyNews / getMarketNews", () => {
  it("maps, dedupes and sorts company news by recency", async () => {
    mockCompanyNews.mockResolvedValue([
      {
        headline: "Older",
        summary: "x",
        source: "S",
        url: "https://o",
        datetime: 1_700_000_000,
      },
      {
        headline: "Newer",
        summary: "y",
        source: "S",
        url: "https://n",
        datetime: 1_800_000_000,
      },
      {
        headline: "Older", // duplicate title
        summary: "z",
        source: "S",
        url: "https://o2",
        datetime: 1_650_000_000,
      },
    ]);

    const result = await getCompanyNews("AAPL");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Newer");
  });

  it("returns market news mapped to NewsItem", async () => {
    mockMarketNews.mockResolvedValue([
      { headline: "Macro", summary: "m", source: "WSJ", url: "https://m", datetime: 1 },
    ]);
    const result = await getMarketNewsWrapper();
    expect(result[0].source).toBe("WSJ");
  });

  async function getMarketNewsWrapper() {
    const mod = await import("./news-intelligence");
    return mod.getMarketNews("general");
  }
});

describe("rankNews", () => {
  it("uses the model ranking when available", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        ranked: [
          { index: 1, relevanceScore: 95, importance: 90, sentiment: "bearish" },
          { index: 0, relevanceScore: 20, importance: 20, sentiment: "neutral" },
        ],
      }),
      model: "gpt-4.1-mini",
      usedFallback: false,
    });

    const ranked = await rankNews(items, { ticker: "ALPHA", limit: 5 });
    expect(ranked[0].title).toBe("Beta routine note");
    expect(ranked[0].sentiment).toBe("bearish");
  });

  it("falls back to recency order when the model fails", async () => {
    mockGenerate.mockRejectedValue(new Error("boom"));
    const ranked = await rankNews(items, { ticker: "ALPHA" });
    expect(ranked).toHaveLength(2);
    expect(ranked[0].score).toBe(25);
    expect(ranked[0].sentiment).toBe("neutral");
  });

  it("returns empty for empty input", async () => {
    expect(await rankNews([], { ticker: "X" })).toEqual([]);
  });
});

describe("summarizeNews", () => {
  it("parses the model summary", async () => {
    mockGenerate.mockResolvedValue({
      content: JSON.stringify({
        summary: "Net positive flow.",
        sentiment: "bullish",
        themes: ["Earnings Beat", "Upgrades"],
      }),
      model: "gpt-4.1-mini",
      usedFallback: false,
    });

    const result = await summarizeNews(items, { ticker: "ALPHA" });
    expect(result.summary).toBe("Net positive flow.");
    expect(result.sentiment).toBe("bullish");
    expect(result.themes).toHaveLength(2);
  });

  it("returns a neutral empty summary with no items", async () => {
    const result = await summarizeNews([], { ticker: "ALPHA" });
    expect(result).toEqual({ summary: "", sentiment: "neutral", themes: [] });
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
