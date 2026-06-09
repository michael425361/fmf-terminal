/**
 * AI cache layer (Phase 7).
 *
 * Priority:
 *   1. Vercel KV (Upstash REST) when KV_REST_API_URL + KV_REST_API_TOKEN are set
 *   2. In-process memory cache (always available, also used as a read-through
 *      mirror so repeated reads in a single instance stay cheap)
 *
 * Edge-runtime compatible: only `fetch` is used (no Node built-ins).
 */

export type AICacheNamespace =
  | "news-summary"
  | "explain-move"
  | "research-report"
  | "earnings-analysis";

/** TTL per namespace, in seconds. */
export const AI_CACHE_TTL_SECONDS: Record<AICacheNamespace, number> = {
  "news-summary": 15 * 60, // 15 minutes
  "explain-move": 30 * 60, // 30 minutes
  "research-report": 6 * 60 * 60, // 6 hours
  "earnings-analysis": 6 * 60 * 60, // 6 hours
};

interface MemoryEntry {
  expiresAt: number;
  value: unknown;
}

const memoryStore = new Map<string, MemoryEntry>();

function kvConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    "";
  if (!url || !token) return null;
  return { url, token };
}

/** Build a stable, collision-resistant cache key. */
export function aiCacheKey(
  namespace: AICacheNamespace,
  ...parts: Array<string | number | undefined | null>
): string {
  const tail = parts
    .map((p) => (p == null ? "" : String(p).trim().toLowerCase()))
    .filter(Boolean)
    .join(":");
  return `fmf:ai:${namespace}:${tail}`;
}

function readMemory<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeMemory<T>(key: string, value: T, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

async function kvCommand<T>(
  cfg: { url: string; token: string },
  command: Array<string | number>
): Promise<T | null> {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV HTTP ${res.status}`);
  }
  const json = (await res.json()) as { result?: T; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result ?? null;
}

/** Read a cached value. Checks memory first, then KV (and back-fills memory). */
export async function getAICache<T>(key: string): Promise<T | null> {
  const local = readMemory<T>(key);
  if (local !== null) return local;

  const cfg = kvConfig();
  if (!cfg) return null;

  try {
    const raw = await kvCommand<string>(cfg, ["GET", key]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    // Mirror into memory with a short floor TTL so we avoid hammering KV.
    writeMemory(key, parsed, 60);
    return parsed;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ai-cache] KV read failed:", (err as Error).message);
    }
    return null;
  }
}

/** Write a value to memory + KV (best-effort) with a TTL in seconds. */
export async function setAICache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  writeMemory(key, value, ttlSeconds);

  const cfg = kvConfig();
  if (!cfg) return;

  try {
    await kvCommand(cfg, [
      "SET",
      key,
      JSON.stringify(value),
      "EX",
      Math.max(1, Math.floor(ttlSeconds)),
    ]);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ai-cache] KV write failed:", (err as Error).message);
    }
  }
}

export interface CachedResult<T> {
  data: T;
  cached: boolean;
}

/**
 * Read-through cache helper. Returns the cached value when present, otherwise
 * runs `producer`, stores the result, and returns it.
 */
export async function withAICache<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>
): Promise<CachedResult<T>> {
  const cached = await getAICache<T>(key);
  if (cached !== null) {
    return { data: cached, cached: true };
  }
  const data = await producer();
  await setAICache(key, data, ttlSeconds);
  return { data, cached: false };
}

/** Test/maintenance helper. */
export function clearMemoryAICache(key?: string): void {
  if (key) memoryStore.delete(key);
  else memoryStore.clear();
}
