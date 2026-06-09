import "server-only";
import { getRedis } from "@/lib/saas/redis";

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** Epoch ms when the daily counter resets (next UTC midnight). */
  resetAt: number;
  /** False when Redis is not configured (no enforcement, request allowed). */
  enforced: boolean;
}

function nextUtcMidnight(now = new Date()): number {
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
}

function secondsUntilReset(now = new Date()): number {
  return Math.max(1, Math.ceil((nextUtcMidnight(now) - now.getTime()) / 1000));
}

function dayStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function quotaKey(userId: string, now = new Date()): string {
  return `quota:${userId}:${dayStamp(now)}`;
}

/**
 * Atomically increments and checks a user's daily AI request count.
 * When the limit would be exceeded the counter is rolled back so it never
 * drifts above the limit on repeated blocked attempts.
 */
export async function consumeDailyQuota(
  userId: string,
  limit: number
): Promise<QuotaResult> {
  const now = new Date();
  const resetAt = nextUtcMidnight(now);
  const redis = getRedis();

  if (!redis) {
    return {
      allowed: true,
      used: 0,
      limit,
      remaining: limit,
      resetAt,
      enforced: false,
    };
  }

  const key = quotaKey(userId, now);
  const used = await redis.incr(key);
  if (used === 1) {
    await redis.expire(key, secondsUntilReset(now));
  }

  if (used > limit) {
    // Roll back the over-limit increment so the counter stays pinned at `limit`.
    await redis.decr(key);
    return {
      allowed: false,
      used: limit,
      limit,
      remaining: 0,
      resetAt,
      enforced: true,
    };
  }

  return {
    allowed: true,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt,
    enforced: true,
  };
}

/** Reads the current daily usage without incrementing (for dashboards). */
export async function peekDailyQuota(
  userId: string,
  limit: number
): Promise<QuotaResult> {
  const now = new Date();
  const resetAt = nextUtcMidnight(now);
  const redis = getRedis();

  if (!redis) {
    return { allowed: true, used: 0, limit, remaining: limit, resetAt, enforced: false };
  }

  const raw = await redis.get<number>(quotaKey(userId, now));
  const used = typeof raw === "number" ? raw : Number(raw ?? 0);
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt,
    enforced: true,
  };
}
