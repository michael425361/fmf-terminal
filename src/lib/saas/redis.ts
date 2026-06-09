import "server-only";
import { Redis } from "@upstash/redis";
import { getRedisRestConfig } from "./config";

/**
 * Shared Upstash Redis client for quotas + rate limiting. Returns null when not
 * configured so callers degrade gracefully (no enforcement in local/dev).
 */
let cached: Redis | null = null;

export function getRedis(): Redis | null {
  const cfg = getRedisRestConfig();
  if (!cfg) return null;
  if (!cached) {
    cached = new Redis({ url: cfg.url, token: cfg.token });
  }
  return cached;
}
