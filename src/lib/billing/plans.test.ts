import { describe, expect, it } from "vitest";
import {
  featureForEndpoint,
  getPlan,
  isValidPlan,
  planAllowsFeature,
  planDailyLimit,
} from "./plans";

describe("plans config", () => {
  it("exposes free and pro daily limits", () => {
    expect(planDailyLimit("free")).toBe(20);
    expect(planDailyLimit("pro")).toBe(500);
  });

  it("gates deep features to pro", () => {
    expect(planAllowsFeature("free", "explain-move")).toBe(true);
    expect(planAllowsFeature("free", "news-summary")).toBe(true);
    expect(planAllowsFeature("free", "market-summary")).toBe(true);
    expect(planAllowsFeature("free", "research-report")).toBe(false);
    expect(planAllowsFeature("free", "earnings-analysis")).toBe(false);
  });

  it("grants all features to pro", () => {
    expect(planAllowsFeature("pro", "research-report")).toBe(true);
    expect(planAllowsFeature("pro", "earnings-analysis")).toBe(true);
    expect(planAllowsFeature("pro", "explain-move")).toBe(true);
  });

  it("defaults unknown plans to free", () => {
    expect(getPlan(null).id).toBe("free");
    expect(getPlan(undefined).id).toBe("free");
  });

  it("validates plan ids", () => {
    expect(isValidPlan("free")).toBe(true);
    expect(isValidPlan("pro")).toBe(true);
    expect(isValidPlan("enterprise")).toBe(false);
    expect(isValidPlan(123)).toBe(false);
  });

  it("maps endpoints to features", () => {
    expect(featureForEndpoint("/api/ai/explain-move")).toBe("explain-move");
    expect(featureForEndpoint("/api/ai/research-report")).toBe("research-report");
    expect(featureForEndpoint("/api/ai/market-summary")).toBe("market-summary");
    expect(featureForEndpoint("/api/ai/news-summary")).toBe("news-summary");
    expect(featureForEndpoint("/api/ai/earnings-analysis")).toBe(
      "earnings-analysis"
    );
    expect(featureForEndpoint("/api/market/quotes")).toBeNull();
  });
});
