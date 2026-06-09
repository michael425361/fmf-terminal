/**
 * Lightweight in-memory sliding-window rate limiter for AI API routes.
 *
 * Edge-compatible (no Node built-ins). State is per-instance; for multi-region
 * production a shared store (KV) can be layered on, but this protects against
 * burst abuse from a single client within an instance.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    ok: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
  };
}

/** Best-effort client identifier from forwarded headers. */
export function clientKey(request: Request, scope: string): string {
  const fwd =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon";
  return `${scope}:${fwd}`;
}

/** Test helper. */
export function resetRateLimit(): void {
  buckets.clear();
}
