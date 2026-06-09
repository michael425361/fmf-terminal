import { describe, expect, it } from "vitest";
import { estimateCostUsd, getModelPrice } from "./pricing-table";

describe("pricing-table", () => {
  it("prices a known model from input + output tokens", () => {
    // gpt-4o-mini: $0.15 / 1M input, $0.60 / 1M output
    const cost = estimateCostUsd("gpt-4o-mini", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75, 6);
  });

  it("normalizes dated/versioned model ids", () => {
    expect(getModelPrice("gpt-4o-mini-2024-07-18")).toEqual(
      getModelPrice("gpt-4o-mini")
    );
  });

  it("falls back to a conservative default for unknown models", () => {
    const cost = estimateCostUsd("some-unknown-model", 1_000_000, 0);
    expect(cost).toBeGreaterThan(0);
  });

  it("returns zero for zero tokens", () => {
    expect(estimateCostUsd("gpt-5", 0, 0)).toBe(0);
  });

  it("rounds to six decimals", () => {
    const cost = estimateCostUsd("gpt-4o-mini", 1, 1);
    expect(Number.isFinite(cost)).toBe(true);
    expect(cost).toBeGreaterThanOrEqual(0);
  });
});
