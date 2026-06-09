# FMF Terminal — Product Roadmap

## Shipped
- **AI Intelligence Layer** — Explain Move, Research Reports, Earnings Analysis,
  News Intelligence, Financial Context Engine, model routing + caching.
- **Phase 3 — SaaS foundation:**
  - M1 Clerk authentication (login, signup, sessions, middleware protection).
  - M2 User profiles (`app_users`) synced from Clerk via webhook.
  - M3 AI usage tracking (`usage_events`: model, tokens, estimated cost).
  - M4 Daily quotas (Redis counters, midnight reset, friendly upgrade message).
  - M5 Stripe billing (checkout, billing portal, webhooks, plan sync).
  - M6 Feature gating (`<FeatureGate>` + server entitlements).
  - M7 Admin dashboard (users, usage, revenue, conversion).
  - M8 Cost analytics (spend by model/feature/day, cache hit rate, cost/user).
  - M9 Security hardening (KV rate limiting, abuse protection, audit + structured logs).
  - M10 Launch documentation.

## Near term (post-launch)
- **Auth unification:** migrate community/watchlist RLS from Supabase `auth.uid()`
  to Clerk JWT (`auth.jwt()->>'sub'`) so there is a single identity system.
  Today both coexist (backward compatible) — see `ARCHITECTURE.md`.
- **Exact token accounting:** thread real OpenAI `usage` (already captured in
  `model-router`) through the AI engine functions into `recordUsage` to replace
  per-feature token estimates.
- **Annual Pro plan** + promo codes.
- **i18n completeness:** add missing `market.assets.cn-*` translation keys.

## Mid term
- **Portfolio Intelligence** (Pro) — holdings ingestion + AI analysis.
- **Watchlist Agent** (Pro) — proactive AI alerts on watched symbols.
- Email digests / notifications.
- Team plans.

## Guardrails
- Keep `tsc --noEmit`, `next build`, and `vitest --coverage` green on every change.
- Maintain backward compatibility / env-guarded integrations.
- Watch AI gross margin on the cost dashboard before loosening quotas.
