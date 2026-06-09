import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe client. Returns null when STRIPE_SECRET_KEY is absent so
 * billing endpoints can respond 503 instead of crashing builds without secrets.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, { typescript: true });
  }
  return cached;
}

export function proPriceId(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? null;
}
