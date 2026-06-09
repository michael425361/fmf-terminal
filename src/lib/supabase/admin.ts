import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, isSupabaseServiceConfigured } from "@/lib/saas/config";

/**
 * Service-role Supabase client for server-only SaaS bookkeeping
 * (app_users, usage_events, subscriptions, app_roles).
 *
 * This client bypasses RLS and MUST never be imported into client components.
 * Returns null when the service role key is not configured so callers can
 * degrade gracefully instead of throwing during builds without secrets.
 */
let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient | null {
  if (!isSupabaseServiceConfigured()) return null;
  if (cached) return cached;

  const url = getSupabaseUrl() as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  cached = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}
