/**
 * Centralized environment detection for SaaS integrations.
 *
 * Each integration is optional at build/runtime: when its env vars are absent
 * the app degrades to its pre-SaaS behavior instead of crashing. This is what
 * keeps CI builds (without secrets) green and preserves backward compatibility.
 */

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

/** Publishable key is enough to render Clerk client components / provider. */
export function hasClerkPublishableKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
  );
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function isClerkWebhookConfigured(): boolean {
  return Boolean(process.env.CLERK_WEBHOOK_SIGNING_SECRET);
}

/**
 * Supabase project URL for server use. Accepts SUPABASE_URL or the public
 * NEXT_PUBLIC_SUPABASE_URL so either naming convention works.
 */
export function getSupabaseUrl(): string | null {
  return (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
  );
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Redis (Upstash) is used for quotas and rate limiting. Supports both the
 * Upstash-native env names and the Vercel KV aliases already used by the AI
 * cache so a single store can back both.
 */
export function getRedisRestConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url, token };
}

export function isRedisConfigured(): boolean {
  return getRedisRestConfig() !== null;
}

/** Absolute app URL for building Stripe/Clerk redirect targets. */
export function getAppUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Clerk user IDs granted admin access (comma-separated env var). */
export function getBootstrapAdminIds(): string[] {
  return (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
