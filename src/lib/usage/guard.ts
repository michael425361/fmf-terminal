import "server-only";
import { NextResponse } from "next/server";
import { getAuthIdentity } from "@/lib/auth/current-user";
import { ensureAppUser, getUserPlan } from "@/lib/saas/app-users";
import { getAppUrl, isClerkConfigured } from "@/lib/saas/config";
import {
  planAllowsFeature,
  planDailyLimit,
  type AIFeature,
  type PlanId,
} from "@/lib/billing/plans";
import { modelChainForTask, type AITaskType } from "@/lib/ai/model-router";
import { checkRateLimit } from "@/lib/saas/rate-limit-kv";
import { logAudit } from "@/lib/saas/audit";
import { consumeDailyQuota } from "./quota";
import { recordUsage } from "./record";

/** Burst-abuse protection: max AI requests per user in a short window. */
const BURST_LIMIT = 30;
const BURST_WINDOW_SECONDS = 60;

export interface GuardContext {
  /** Null when Clerk is not configured (pre-SaaS public mode). */
  userId: string | null;
  plan: PlanId;
}

export type GuardOutcome =
  | { ok: true; ctx: GuardContext }
  | { ok: false; response: NextResponse };

const FEATURE_TASK: Partial<Record<AIFeature, AITaskType>> = {
  "news-summary": "news-summary",
  "explain-move": "explain-move",
  "research-report": "research-report",
  "earnings-analysis": "earnings-analysis",
};

/** Rough baseline prompt-token estimate per feature (context-engine payloads). */
const BASELINE_PROMPT_TOKENS: Record<AIFeature, number> = {
  "market-summary": 1000,
  "news-summary": 1500,
  "explain-move": 700,
  "research-report": 2500,
  "earnings-analysis": 2000,
};

export function modelForFeature(feature: AIFeature): string {
  const task = FEATURE_TASK[feature];
  if (task) return modelChainForTask(task)[0];
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function upgradeUrl(locale: string): string {
  return `${getAppUrl()}/${locale}/pricing`;
}

/**
 * Enforces auth + feature entitlement + daily quota for an AI request.
 *
 * When Clerk is not configured the request is allowed through with a null
 * userId (preserves the pre-SaaS public behavior and keeps tests/builds green).
 */
export async function guardAIRequest(
  feature: AIFeature,
  locale: string,
  ip?: string
): Promise<GuardOutcome> {
  if (!isClerkConfigured()) {
    return { ok: true, ctx: { userId: null, plan: "free" } };
  }

  const identity = await getAuthIdentity();
  if (!identity) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "auth_required",
          message: "Please sign in to use AI features.",
          upgradeUrl: `${getAppUrl()}/${locale}/sign-in`,
        },
        { status: 401 }
      ),
    };
  }

  const { userId, email } = identity;
  await ensureAppUser(userId, email);

  // Burst-abuse protection (distributed when Redis is configured).
  const burst = await checkRateLimit(
    `ai:${userId}`,
    BURST_LIMIT,
    BURST_WINDOW_SECONDS
  );
  if (!burst.allowed) {
    void logAudit({
      userId,
      action: "rate_limited",
      resource: feature,
      ip,
      metadata: { limit: BURST_LIMIT, windowSeconds: BURST_WINDOW_SECONDS },
    });
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          message: "Too many requests. Please slow down and try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((burst.resetAt - Date.now()) / 1000))
            ),
          },
        }
      ),
    };
  }

  const plan = await getUserPlan(userId);

  if (!planAllowsFeature(plan, feature)) {
    void logAudit({
      userId,
      action: "feature_locked",
      resource: feature,
      ip,
      metadata: { plan },
    });
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "feature_locked",
          message: "This feature is available on the Pro plan. Upgrade to unlock it.",
          plan,
          feature,
          upgradeUrl: upgradeUrl(locale),
        },
        { status: 403 }
      ),
    };
  }

  const limit = planDailyLimit(plan);
  const quota = await consumeDailyQuota(userId, limit);
  if (!quota.allowed) {
    void logAudit({
      userId,
      action: "quota_exceeded",
      resource: feature,
      ip,
      metadata: { plan, limit },
    });
    const message =
      plan === "free"
        ? `You've reached your free daily limit of ${limit} AI requests. Upgrade to Pro for ${planDailyLimit(
            "pro"
          )} requests per day.`
        : `You've reached your daily limit of ${limit} AI requests. Your quota resets at ${new Date(
            quota.resetAt
          ).toISOString()}.`;
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "quota_exceeded",
          message,
          plan,
          limit,
          used: quota.used,
          resetAt: quota.resetAt,
          upgradeUrl: upgradeUrl(locale),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((quota.resetAt - Date.now()) / 1000))
            ),
            "X-Quota-Limit": String(limit),
            "X-Quota-Remaining": String(quota.remaining),
          },
        }
      ),
    };
  }

  return { ok: true, ctx: { userId, plan } };
}

/**
 * Records an AI request against usage_events. Token counts are estimated from
 * the response payload + a per-feature prompt baseline when exact provider
 * usage isn't surfaced. Fire-and-forget; no-ops without a userId.
 */
export async function recordAIUsage(
  ctx: GuardContext,
  args: {
    endpoint: string;
    feature: AIFeature;
    cached: boolean;
    responseText: string;
    model?: string;
    usage?: { promptTokens: number; completionTokens: number };
  }
): Promise<void> {
  if (!ctx.userId) return;

  const model = args.model ?? modelForFeature(args.feature);
  const promptTokens =
    args.usage?.promptTokens ??
    (args.cached ? 0 : BASELINE_PROMPT_TOKENS[args.feature]);
  const completionTokens =
    args.usage?.completionTokens ?? estimateTokens(args.responseText);

  await recordUsage({
    userId: ctx.userId,
    endpoint: args.endpoint,
    feature: args.feature,
    model,
    promptTokens,
    completionTokens,
    cached: args.cached,
  });
}
