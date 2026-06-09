import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatEnvReport, getEnvReport } from "./env";

const REQUIRED_VALID: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  OPENAI_API_KEY: "sk-test",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
  CLERK_SECRET_KEY: "sk_test_x",
  STRIPE_SECRET_KEY: "sk_test_stripe",
  STRIPE_WEBHOOK_SECRET: "whsec_x",
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: "price_x",
  UPSTASH_REDIS_REST_URL: "https://db.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

const REQUIRED_KEYS = [
  ...Object.keys(REQUIRED_VALID),
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
];

describe("env validation", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    for (const k of REQUIRED_KEYS) delete process.env[k];
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("reports all required vars missing on an empty env", () => {
    const report = getEnvReport();
    expect(report.requiredOk).toBe(0);
    expect(report.problems.length).toBe(report.requiredTotal);
    expect(report.problems.every((p) => p.status === "missing")).toBe(true);
  });

  it("passes when all required vars are valid", () => {
    Object.assign(process.env, REQUIRED_VALID);
    const report = getEnvReport();
    expect(report.problems).toHaveLength(0);
    expect(report.requiredOk).toBe(report.requiredTotal);
  });

  it("flags an invalid URL value", () => {
    Object.assign(process.env, REQUIRED_VALID);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    const report = getEnvReport();
    const entry = report.entries.find(
      (e) => e.name === "NEXT_PUBLIC_SUPABASE_URL"
    );
    expect(entry?.status).toBe("invalid");
  });

  it("resolves a value from an alias", () => {
    Object.assign(process.env, REQUIRED_VALID);
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.KV_REST_API_URL = "https://db.upstash.io";
    const report = getEnvReport();
    const entry = report.entries.find(
      (e) => e.name === "UPSTASH_REDIS_REST_URL"
    );
    expect(entry?.status).toBe("ok");
    expect(entry?.resolvedFrom).toBe("KV_REST_API_URL");
  });

  it("never includes secret values in the formatted report", () => {
    Object.assign(process.env, REQUIRED_VALID);
    process.env.OPENAI_API_KEY = "sk-super-secret-value";
    const text = formatEnvReport(getEnvReport());
    expect(text).not.toContain("sk-super-secret-value");
    expect(text).toContain("OPENAI_API_KEY");
  });
});
