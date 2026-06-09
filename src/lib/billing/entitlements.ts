import "server-only";
import { getAuthUserId } from "@/lib/auth/current-user";
import { getUserPlan } from "@/lib/saas/app-users";
import { isClerkConfigured } from "@/lib/saas/config";
import {
  ALL_AI_FEATURES,
  getPlan,
  planDailyLimit,
  type AIFeature,
  type PlanId,
} from "./plans";

export interface Entitlements {
  authed: boolean;
  plan: PlanId;
  features: AIFeature[];
  dailyLimit: number;
}

/**
 * Resolves the current request's entitlements.
 *
 * When Clerk is not configured the app runs in public mode and exposes every
 * feature (preserves pre-SaaS behavior so the UI isn't gated unexpectedly).
 */
export async function getCurrentEntitlements(): Promise<Entitlements> {
  if (!isClerkConfigured()) {
    return {
      authed: false,
      plan: "pro",
      features: [...ALL_AI_FEATURES],
      dailyLimit: planDailyLimit("pro"),
    };
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return {
      authed: false,
      plan: "free",
      features: [...getPlan("free").features],
      dailyLimit: planDailyLimit("free"),
    };
  }

  const plan = await getUserPlan(userId);
  return {
    authed: true,
    plan,
    features: [...getPlan(plan).features],
    dailyLimit: planDailyLimit(plan),
  };
}
