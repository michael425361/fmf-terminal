# FMF Terminal — Architecture

> AI research terminal for retail investors. Next.js 15 (App Router) · TypeScript (strict) · Supabase · Clerk · Stripe · Upstash Redis · Vercel.

## High-level

```
Browser
  │
  ├─ Clerk (hosted auth, sessions, JWT)
  │
  ├─ Next.js middleware  ── Clerk auth context + next-intl locale routing + Supabase session refresh
  │
  ├─ Server Components / Route Handlers
  │     ├─ getAuthUserId()            → Clerk user id
  │     ├─ Entitlements (plan → features/limits)
  │     ├─ guardAIRequest()           → auth + feature gate + burst limit + daily quota
  │     ├─ AI engines (model-router → OpenAI)
  │     ├─ recordUsage()              → usage_events (token + estimated cost)
  │     └─ Supabase service-role client (SaaS bookkeeping)
  │
  ├─ Stripe Checkout / Billing Portal
  ├─ Webhooks: /api/webhooks/stripe, /api/webhooks/clerk
  └─ Upstash Redis (daily quotas + distributed rate limiting + AI cache)
```

## Design principle: graceful degradation
Every SaaS integration is **env-guarded** via `src/lib/saas/config.ts`. When a
provider's keys are absent the feature no-ops and the app falls back to its
pre-SaaS public behavior. This keeps CI builds green without secrets and makes
the rollout fully backward compatible.

| Integration | Guard | Behavior when unconfigured |
|---|---|---|
| Clerk | `isClerkConfigured()` | Public mode; AI routes open; no gating |
| Supabase service role | `isSupabaseServiceConfigured()` | No bookkeeping writes (usage/subscriptions) |
| Stripe | `isStripeConfigured()` | Billing endpoints return 503 |
| Upstash Redis | `isRedisConfigured()` | In-memory fallback; quotas not enforced cross-instance |

## Key modules
| Area | Path |
|---|---|
| Plans / tiers (source of truth) | `src/lib/billing/plans.ts` |
| Pricing table (cost estimation) | `src/lib/billing/pricing-table.ts` |
| Stripe client | `src/lib/billing/stripe.ts` |
| Entitlements (server) | `src/lib/billing/entitlements.ts` |
| Auth helpers | `src/lib/auth/current-user.ts` |
| Service-role DB client | `src/lib/supabase/admin.ts` |
| App users / profiles | `src/lib/saas/app-users.ts` |
| Subscriptions sync | `src/lib/saas/subscriptions.ts` |
| Admin auth + analytics | `src/lib/saas/admin.ts`, `src/lib/saas/analytics.ts` |
| AI guard (auth+gate+quota+abuse) | `src/lib/usage/guard.ts` |
| Daily quotas | `src/lib/usage/quota.ts` |
| Usage recording | `src/lib/usage/record.ts` |
| Rate limiting (KV) | `src/lib/saas/rate-limit-kv.ts` |
| Audit + logging | `src/lib/saas/audit.ts`, `src/lib/observability/logger.ts` |

## Auth model
- **Clerk** is the identity provider (sign-in/up at `/[locale]/sign-in`, `/sign-up`).
- Middleware composes `clerkMiddleware` → protected-route check → next-intl → Supabase session refresh.
- Protected page prefixes: `/[locale]/account/**`, `/[locale]/admin/**`.
- AI route handlers enforce auth + entitlements server-side via `guardAIRequest`.
- The legacy Supabase `AuthProvider` remains for community/watchlist (backward
  compatible). Full unification of community/watchlist onto Clerk JWT → Supabase
  RLS is a documented follow-up (see roadmap).

## Data model (additive migrations 007–011)
`app_users`, `usage_events`, `subscriptions`, `app_roles` (+ analytics views),
`audit_logs`. All new tables are **service-role-only RLS**; the browser never
reads/writes them directly. Existing tables (`profiles`, `posts`, etc.) are
untouched.

## Request lifecycle for an AI call
1. Route handler validates body (Zod) + coarse IP rate limit (existing).
2. `guardAIRequest(feature, locale, ip)`:
   - require Clerk auth (401 if missing),
   - ensure `app_users` row,
   - burst rate limit (`rl:ai:<user>` 30/60s),
   - feature entitlement (403 if locked),
   - daily quota INCR (429 if exceeded).
3. Produce result (cache-aware via `withAICache`).
4. `recordAIUsage` → `usage_events` (model, tokens, estimated cost, cached).
