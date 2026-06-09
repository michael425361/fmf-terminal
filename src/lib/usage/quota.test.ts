import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getRedisMock } = vi.hoisted(() => ({ getRedisMock: vi.fn() }));
vi.mock("@/lib/saas/redis", () => ({ getRedis: getRedisMock }));

import { consumeDailyQuota, peekDailyQuota } from "./quota";

function fakeRedis() {
  let count = 0;
  return {
    incr: vi.fn(async () => ++count),
    decr: vi.fn(async () => --count),
    expire: vi.fn(async () => 1),
    get: vi.fn(async () => count),
    _count: () => count,
  };
}

describe("consumeDailyQuota", () => {
  beforeEach(() => getRedisMock.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("does not enforce when redis is unavailable", async () => {
    getRedisMock.mockReturnValue(null);
    const result = await consumeDailyQuota("user_1", 20);
    expect(result.enforced).toBe(false);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(20);
  });

  it("allows requests up to the limit then blocks", async () => {
    const redis = fakeRedis();
    getRedisMock.mockReturnValue(redis as never);

    const first = await consumeDailyQuota("user_2", 2);
    expect(first.allowed).toBe(true);
    expect(first.used).toBe(1);
    expect(redis.expire).toHaveBeenCalledTimes(1); // ttl set on first incr

    const second = await consumeDailyQuota("user_2", 2);
    expect(second.allowed).toBe(true);
    expect(second.used).toBe(2);

    const third = await consumeDailyQuota("user_2", 2);
    expect(third.allowed).toBe(false);
    expect(third.used).toBe(2);
    expect(third.remaining).toBe(0);
    // Over-limit increment was rolled back.
    expect(redis.decr).toHaveBeenCalledTimes(1);
    expect(redis._count()).toBe(2);
  });

  it("computes a future reset timestamp", async () => {
    getRedisMock.mockReturnValue(null);
    const result = await consumeDailyQuota("user_3", 20);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});

describe("peekDailyQuota", () => {
  beforeEach(() => getRedisMock.mockReset());

  it("reads usage without incrementing", async () => {
    const redis = fakeRedis();
    getRedisMock.mockReturnValue(redis as never);
    const result = await peekDailyQuota("user_4", 20);
    expect(redis.incr).not.toHaveBeenCalled();
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(20);
  });
});
