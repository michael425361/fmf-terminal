/**
 * Single source of truth for SaaS plans, limits, and feature entitlements.
 *
 * Everything monetization-related (quotas, feature gating, billing copy) reads
 * from here so tiers can be tuned in one place.
 */

export type PlanId = "free" | "pro";

/** AI capabilities that can be individually gated per plan. */
export type AIFeature =
  | "market-summary"
  | "news-summary"
  | "explain-move"
  | "research-report"
  | "earnings-analysis";

export interface PlanConfig {
  id: PlanId;
  /** Human-friendly name for UI. */
  name: string;
  /** Price in USD per month (0 for free). */
  monthlyPriceUsd: number;
  /** Max AI requests counted against the daily quota. */
  dailyRequestLimit: number;
  /** AI features this plan is entitled to use. */
  features: readonly AIFeature[];
}

export const ALL_AI_FEATURES: readonly AIFeature[] = [
  "market-summary",
  "news-summary",
  "explain-move",
  "research-report",
  "earnings-analysis",
] as const;

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    dailyRequestLimit: 20,
    features: ["market-summary", "news-summary", "explain-move"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 19,
    dailyRequestLimit: 500,
    features: ALL_AI_FEATURES,
  },
};

export const DEFAULT_PLAN: PlanId = "free";

export function getPlan(plan: PlanId | null | undefined): PlanConfig {
  if (plan && plan in PLANS) {
    return PLANS[plan];
  }
  return PLANS[DEFAULT_PLAN];
}

export function isValidPlan(value: unknown): value is PlanId {
  return value === "free" || value === "pro";
}

/** Whether a plan is entitled to use a given AI feature. */
export function planAllowsFeature(plan: PlanId, feature: AIFeature): boolean {
  return getPlan(plan).features.includes(feature);
}

/** Daily request quota for a plan. */
export function planDailyLimit(plan: PlanId): number {
  return getPlan(plan).dailyRequestLimit;
}

/**
 * Maps an AI API route path (e.g. "/api/ai/explain-move") to its feature key.
 * Returns null for non-AI or unknown endpoints.
 */
export function featureForEndpoint(endpoint: string): AIFeature | null {
  const normalized = endpoint.replace(/\/+$/, "");
  switch (true) {
    case normalized.endsWith("/api/ai/market-summary"):
      return "market-summary";
    case normalized.endsWith("/api/ai/news-summary"):
      return "news-summary";
    case normalized.endsWith("/api/ai/explain-move"):
      return "explain-move";
    case normalized.endsWith("/api/ai/research-report"):
      return "research-report";
    case normalized.endsWith("/api/ai/earnings-analysis"):
      return "earnings-analysis";
    default:
      return null;
  }
}
