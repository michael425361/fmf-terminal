import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRedisMock } = vi.hoisted(() => ({ getRedisMock: vi.fn() }));
vi.mock("./redis", () => ({ getRedis: getRedisMock }));

import { checkRateLimit, clientIp } from "./rate-limit-kv";

describe("checkRateLimit (memory fallback)", () => {
  beforeEach(() => getRedisMock.mockReset());

  it("allows up to the limit then blocks within the window", async () => {
    getRedisMock.mockReturnValue(null);
    const key = `test-${Math.random()}`;
    const a = await checkRateLimit(key, 2, 60);
    const b = await checkRateLimit(key, 2, 60);
    const c = await checkRateLimit(key, 2, 60);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(false);
    expect(c.remaining).toBe(0);
  });
});

describe("checkRateLimit (redis path)", () => {
  beforeEach(() => getRedisMock.mockReset());

  it("uses INCR + EXPIRE and blocks over the limit", async () => {
    let count = 0;
    const redis = {
      incr: vi.fn(async () => ++count),
      expire: vi.fn(async () => 1),
      ttl: vi.fn(async () => 60),
    };
    getRedisMock.mockReturnValue(redis as never);

    const first = await checkRateLimit("k", 1, 60);
    expect(first.allowed).toBe(true);
    expect(redis.expire).toHaveBeenCalledTimes(1);

    const second = await checkRateLimit("k", 1, 60);
    expect(second.allowed).toBe(false);
  });
});

describe("clientIp", () => {
  it("reads the first x-forwarded-for entry", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to unknown", () => {
    expect(clientIp(new Request("https://x.test"))).toBe("unknown");
  });
});
