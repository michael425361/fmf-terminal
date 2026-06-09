import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PLAN, isValidPlan, type PlanId } from "@/lib/billing/plans";

const TABLE = "app_users";

export interface AppUser {
  clerk_user_id: string;
  email: string | null;
  plan: PlanId;
  stripe_customer_id: string | null;
  created_at: string;
  last_active_at: string;
}

/**
 * Inserts the user row if missing and refreshes email / last_active_at.
 * No-ops (returns null) when the service-role client is not configured.
 */
export async function ensureAppUser(
  userId: string,
  email: string | null
): Promise<AppUser | null> {
  const db = createAdminClient();
  if (!db) return null;

  const now = new Date().toISOString();
  const { data, error } = await db
    .from(TABLE)
    .upsert(
      {
        clerk_user_id: userId,
        email,
        last_active_at: now,
      },
      { onConflict: "clerk_user_id" }
    )
    .select("*")
    .single();

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[app-users] ensureAppUser failed:", error.message);
    }
    return null;
  }
  return data as AppUser;
}

export async function getAppUser(userId: string): Promise<AppUser | null> {
  const db = createAdminClient();
  if (!db) return null;

  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AppUser;
}

/** Effective plan for a user; defaults to free when unknown/unconfigured. */
export async function getUserPlan(userId: string): Promise<PlanId> {
  const user = await getAppUser(userId);
  if (user && isValidPlan(user.plan)) return user.plan;
  return DEFAULT_PLAN;
}

/** Best-effort last-active timestamp bump (fire-and-forget). */
export async function touchLastActive(userId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  await db
    .from(TABLE)
    .update({ last_active_at: new Date().toISOString() })
    .eq("clerk_user_id", userId);
}

/** Sets the effective plan (called by the Stripe webhook on subscription change). */
export async function setUserPlan(
  userId: string,
  plan: PlanId,
  stripeCustomerId?: string | null
): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  await db.from(TABLE).upsert(
    {
      clerk_user_id: userId,
      plan,
      ...(stripeCustomerId !== undefined
        ? { stripe_customer_id: stripeCustomerId }
        : {}),
    },
    { onConflict: "clerk_user_id" }
  );
}

export async function deleteAppUser(userId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  await db.from(TABLE).delete().eq("clerk_user_id", userId);
}
