import { z } from "zod";

/**
 * Startup environment validation.
 *
 * - Validates required variables (with Zod) when the server boots.
 * - Prints clear, actionable errors in development.
 * - Never throws: production fails gracefully (env-guarded features degrade
 *   instead of crashing the server).
 * - Never logs secret VALUES — only names and presence/validity status.
 *
 * Wired via `src/instrumentation.ts` (`register()` runs once at startup).
 */

export type EnvTier = "required" | "recommended" | "optional";
export type EnvStatus = "ok" | "missing" | "invalid";

interface EnvVarSpec {
  name: string;
  tier: EnvTier;
  service: string;
  /** Mask the value in any output (it's a credential). */
  secret: boolean;
  /** Zod schema validating a present value. */
  schema: z.ZodType<string>;
  /** Alternative env var names that satisfy this variable. */
  aliases?: string[];
}

const url = z.string().url();
const nonEmpty = z.string().min(1);

const SPECS: EnvVarSpec[] = [
  // ── Required ──────────────────────────────────────────────────────────
  { name: "NEXT_PUBLIC_SUPABASE_URL", tier: "required", service: "Supabase", secret: false, schema: url },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", tier: "required", service: "Supabase", secret: false, schema: nonEmpty },
  { name: "SUPABASE_SERVICE_ROLE_KEY", tier: "required", service: "Supabase", secret: true, schema: nonEmpty },
  { name: "OPENAI_API_KEY", tier: "required", service: "OpenAI", secret: true, schema: nonEmpty },
  { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", tier: "required", service: "Clerk", secret: false, schema: nonEmpty },
  { name: "CLERK_SECRET_KEY", tier: "required", service: "Clerk", secret: true, schema: nonEmpty },
  { name: "STRIPE_SECRET_KEY", tier: "required", service: "Stripe", secret: true, schema: nonEmpty },
  { name: "STRIPE_WEBHOOK_SECRET", tier: "required", service: "Stripe", secret: true, schema: nonEmpty },
  { name: "NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY", tier: "required", service: "Stripe", secret: false, schema: nonEmpty },
  { name: "UPSTASH_REDIS_REST_URL", tier: "required", service: "Upstash", secret: false, schema: url, aliases: ["KV_REST_API_URL"] },
  { name: "UPSTASH_REDIS_REST_TOKEN", tier: "required", service: "Upstash", secret: true, schema: nonEmpty, aliases: ["KV_REST_API_TOKEN"] },

  // ── Recommended ───────────────────────────────────────────────────────
  { name: "NEXT_PUBLIC_SITE_URL", tier: "recommended", service: "App", secret: false, schema: url },
  { name: "NEXT_PUBLIC_APP_URL", tier: "recommended", service: "App", secret: false, schema: url },
  { name: "CLERK_WEBHOOK_SIGNING_SECRET", tier: "recommended", service: "Clerk", secret: true, schema: nonEmpty },
  { name: "ADMIN_CLERK_USER_IDS", tier: "recommended", service: "Clerk", secret: false, schema: nonEmpty },
  { name: "FINNHUB_API_KEY", tier: "recommended", service: "Finnhub", secret: true, schema: nonEmpty },
  { name: "TWELVE_DATA_API_KEY", tier: "recommended", service: "Twelve Data", secret: true, schema: nonEmpty, aliases: ["TWELVEDATA_API_KEY"] },

  // ── Optional ──────────────────────────────────────────────────────────
  { name: "NEXT_PUBLIC_CLERK_SIGN_IN_URL", tier: "optional", service: "Clerk", secret: false, schema: nonEmpty },
  { name: "NEXT_PUBLIC_CLERK_SIGN_UP_URL", tier: "optional", service: "Clerk", secret: false, schema: nonEmpty },
  { name: "OPENAI_MODEL", tier: "optional", service: "OpenAI", secret: false, schema: nonEmpty },
  { name: "OPENAI_FAST_MODEL", tier: "optional", service: "OpenAI", secret: false, schema: nonEmpty },
  { name: "OPENAI_DEEP_MODEL", tier: "optional", service: "OpenAI", secret: false, schema: nonEmpty },
  { name: "OPENAI_FALLBACK_MODEL", tier: "optional", service: "OpenAI", secret: false, schema: nonEmpty },
  { name: "SUPABASE_URL", tier: "optional", service: "Supabase", secret: false, schema: url },
];

export interface EnvReportEntry {
  name: string;
  tier: EnvTier;
  service: string;
  secret: boolean;
  status: EnvStatus;
  /** Which env name actually provided the value (name or alias). */
  resolvedFrom: string | null;
}

export interface EnvReport {
  entries: EnvReportEntry[];
  requiredOk: number;
  requiredTotal: number;
  problems: EnvReportEntry[]; // required entries that are missing/invalid
  recommendedMissing: EnvReportEntry[];
}

function resolve(spec: EnvVarSpec): { value: string | undefined; from: string | null } {
  const names = [spec.name, ...(spec.aliases ?? [])];
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== "") return { value: v, from: n };
  }
  return { value: undefined, from: null };
}

/** Builds the validation report. Pure (no logging, no throwing). */
export function getEnvReport(): EnvReport {
  const entries: EnvReportEntry[] = SPECS.map((spec) => {
    const { value, from } = resolve(spec);
    let status: EnvStatus;
    if (value === undefined) {
      status = "missing";
    } else {
      status = spec.schema.safeParse(value).success ? "ok" : "invalid";
    }
    return {
      name: spec.name,
      tier: spec.tier,
      service: spec.service,
      secret: spec.secret,
      status,
      resolvedFrom: status === "ok" ? from : null,
    };
  });

  const required = entries.filter((e) => e.tier === "required");
  const problems = required.filter((e) => e.status !== "ok");
  const recommendedMissing = entries.filter(
    (e) => e.tier === "recommended" && e.status === "missing"
  );

  return {
    entries,
    requiredOk: required.length - problems.length,
    requiredTotal: required.length,
    problems,
    recommendedMissing,
  };
}

/** Human-readable, secret-safe report (status only, never values). */
export function formatEnvReport(report: EnvReport): string {
  const symbol = (s: EnvStatus) =>
    s === "ok" ? "✓" : s === "invalid" ? "✗ invalid" : "✗ missing";
  const byTier = (tier: EnvTier) =>
    report.entries
      .filter((e) => e.tier === tier)
      .map((e) => `   ${symbol(e.status).padEnd(10)} ${e.name}  (${e.service})`)
      .join("\n");

  return [
    `Environment validation — ${report.requiredOk}/${report.requiredTotal} required variables set`,
    "  Required:",
    byTier("required"),
    "  Recommended:",
    byTier("recommended"),
    "  Optional:",
    byTier("optional"),
  ].join("\n");
}

let validated = false;

/**
 * Validates the environment once at startup. Logs a clear report and any
 * problems. Returns the report; never throws.
 */
export function validateEnv(): EnvReport {
  const report = getEnvReport();

  // Avoid noise in unit tests.
  if (process.env.NODE_ENV === "test") return report;
  if (validated) return report;
  validated = true;

  const isProd = process.env.NODE_ENV === "production";

  if (report.problems.length > 0) {
    const lines = report.problems
      .map((p) => `  • ${p.name} (${p.service}) — ${p.status}`)
      .join("\n");

    if (isProd) {
      // Graceful in production: warn, do not crash. Affected features degrade.
      console.warn(
        `[env] ${report.problems.length} required variable(s) not set; ` +
          `related features will be disabled:\n${lines}`
      );
    } else {
      console.error(
        "\n\x1b[31m[env] Missing/invalid required environment variables:\x1b[0m\n" +
          lines +
          "\n\n  Fix: copy .env.local.example to .env.local and fill in the values.\n" +
          "  See docs/ENVIRONMENT_SETUP.md for where to obtain each key.\n"
      );
    }
  }

  if (!isProd) {
    if (report.recommendedMissing.length > 0) {
      console.warn(
        `[env] Recommended variables not set: ` +
          report.recommendedMissing.map((e) => e.name).join(", ")
      );
    }
    // Full status report in development (secret-safe).
    console.info(`\n${formatEnvReport(report)}\n`);
  }

  return report;
}
