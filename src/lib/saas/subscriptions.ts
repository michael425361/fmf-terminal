import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { proPriceId } from "@/lib/billing/stripe";
import { DEFAULT_PLAN, type PlanId } from "@/lib/billing/plans";
import { setUserPlan } from "./app-users";

const TABLE = "subscriptions";

export interface SubscriptionRecord {
  clerk_user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  plan: PlanId;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** Active-like Stripe statuses that grant Pro entitlements. */
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export function planForPrice(priceId: string | null | undefined): PlanId {
  const pro = proPriceId();
  if (pro && priceId === pro) return "pro";
  return DEFAULT_PLAN;
}

/** Resolve the effective plan from a Stripe subscription's price + status. */
export function planForSubscription(sub: Stripe.Subscription): PlanId {
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const byPrice = planForPrice(priceId);
  if (byPrice === "pro" && ENTITLED_STATUSES.has(sub.status)) return "pro";
  return DEFAULT_PLAN;
}

export async function getSubscription(
  userId: string
): Promise<SubscriptionRecord | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SubscriptionRecord;
}

/**
 * Persists Stripe subscription state into Supabase and mirrors the effective
 * plan onto app_users (the source of truth read by quota/gating).
 */
export async function syncSubscription(
  userId: string,
  sub: Stripe.Subscription
): Promise<void> {
  const db = createAdminClient();
  if (!db) return;

  const plan = planForSubscription(sub);
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const periodEnd = sub.items.data[0]?.current_period_end ?? null;

  const record: SubscriptionRecord = {
    clerk_user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    plan,
    price_id: priceId,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
  };

  await db
    .from(TABLE)
    .upsert({ ...record, updated_at: new Date().toISOString() }, {
      onConflict: "clerk_user_id",
    });

  await setUserPlan(userId, plan, customerId);
}

/** Downgrades a user to free (subscription canceled/deleted). */
export async function downgradeToFree(userId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  await db
    .from(TABLE)
    .upsert(
      {
        clerk_user_id: userId,
        plan: "free",
        status: "canceled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" }
    );
  await setUserPlan(userId, "free");
}
