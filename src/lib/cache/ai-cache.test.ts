import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AI_CACHE_TTL_SECONDS,
  aiCacheKey,
  clearMemoryAICache,
  getAICache,
  setAICache,
  withAICache,
} from "./ai-cache";

describe("ai-cache", () => {
  beforeEach(() => {
    clearMemoryAICache();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds normalized, namespaced keys", () => {
    expect(aiCacheKey("explain-move", "AAPL", "en", 3.2)).toBe(
      "fmf:ai:explain-move:aapl:en:3.2"
    );
    expect(aiCacheKey("news-summary", " TSLA ", null, undefined)).toBe(
      "fmf:ai:news-summary:tsla"
    );
  });

  it("exposes the required TTLs per namespace", () => {
    expect(AI_CACHE_TTL_SECONDS["news-summary"]).toBe(15 * 60);
    expect(AI_CACHE_TTL_SECONDS["explain-move"]).toBe(30 * 60);
    expect(AI_CACHE_TTL_SECONDS["research-report"]).toBe(6 * 60 * 60);
    expect(AI_CACHE_TTL_SECONDS["earnings-analysis"]).toBe(6 * 60 * 60);
  });

  it("returns null for a missing key", async () => {
    expect(await getAICache("missing")).toBeNull();
  });

  it("stores and reads a value from memory", async () => {
    await setAICache("k1", { a: 1 }, 60);
    expect(await getAICache<{ a: number }>("k1")).toEqual({ a: 1 });
  });

  it("expires values after the TTL window", async () => {
    vi.useFakeTimers();
    await setAICache("k2", "v", 10);
    expect(await getAICache("k2")).toBe("v");
    vi.advanceTimersByTime(11_000);
    expect(await getAICache("k2")).toBeNull();
  });

  it("withAICache runs the producer once and serves cache after", async () => {
    const producer = vi.fn().mockResolvedValue({ value: 42 });

    const first = await withAICache("k3", 60, producer);
    expect(first).toEqual({ data: { value: 42 }, cached: false });

    const second = await withAICache("k3", 60, producer);
    expect(second).toEqual({ data: { value: 42 }, cached: true });
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it("clearMemoryAICache(key) removes a single entry", async () => {
    await setAICache("k4", 1, 60);
    await setAICache("k5", 2, 60);
    clearMemoryAICache("k4");
    expect(await getAICache("k4")).toBeNull();
    expect(await getAICache("k5")).toBe(2);
  });
});

describe("ai-cache with KV backend", () => {
  beforeEach(() => {
    clearMemoryAICache();
    process.env.KV_REST_API_URL = "https://kv.example.com";
    process.env.KV_REST_API_TOKEN = "token";
  });

  afterEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    vi.unstubAllGlobals();
  });

  it("reads and JSON-parses a value from KV", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: JSON.stringify({ hello: "world" }) }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const value = await getAICache<{ hello: string }>("kv-key");
    expect(value).toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://kv.example.com",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns null on a KV miss", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: null }) })
    );
    expect(await getAICache("absent")).toBeNull();
  });

  it("swallows KV read errors and returns null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await getAICache("boom")).toBeNull();
  });

  it("writes a SET command with EX ttl to KV", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ result: "OK" }) });
    vi.stubGlobal("fetch", fetchMock);

    await setAICache("kv-write", { n: 1 }, 120);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body[0]).toBe("SET");
    expect(body[1]).toBe("kv-write");
    expect(body).toContain("EX");
    expect(body).toContain(120);
  });
});
