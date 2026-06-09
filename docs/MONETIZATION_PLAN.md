# FMF Terminal — Monetization Plan

## Positioning
The **AI research terminal for retail investors** — not a charting platform or
TradingView competitor. The paid value is AI: Explain Move, Research Reports,
Earnings Analysis, News Intelligence, and the Financial Context Engine.

## Tiers (source of truth: `src/lib/billing/plans.ts`)

| | Free | Pro |
|---|---|---|
| Price | $0 | **$19 / month** |
| Daily AI requests | 20 | 500 |
| AI Market Summary | ✅ | ✅ |
| News Intelligence | ✅ | ✅ |
| Explain Move | ✅ | ✅ |
| AI Research Reports | ❌ | ✅ |
| Earnings Analysis | ❌ | ✅ |
| Portfolio Intelligence (future) | ❌ | ✅ |
| Watchlist Agent (future) | ❌ | ✅ |

Enforcement is two-dimensional:
- **Feature gating** — boolean access (e.g. Research Reports are Pro-only).
- **Daily quota** — request count per UTC day, stored in Redis, reset at midnight.

Both are enforced server-side in `guardAIRequest` and surfaced in the UI via
`<FeatureGate>` + the `/api/me/entitlements` endpoint.

## Unit economics & margin
- Every AI request is logged to `usage_events` with model, tokens, and
  `estimated_cost_usd` (pricing in `src/lib/billing/pricing-table.ts`).
- The admin **Cost analytics** page (`/[locale]/admin/cost`) shows spend by
  model/feature/day, cache hit rate, and cost per active user.
- The admin **overview** shows estimated MRR and gross margin (revenue − AI cost).
- **Margin levers:** aggressive caching (already in place via `ai-cache`), model
  routing (fast vs deep tiers), and the 500/day Pro ceiling that caps worst-case
  cost per subscriber.

### Rough cost ceiling per Pro user
At 500 requests/day with deep-model reports being the costliest path, monitor
`cost per active user` on the cost dashboard. Target: keep blended cost/Pro-user
well under the $19 price to maintain positive gross margin. Adjust
`dailyRequestLimit`, feature mix, or cache TTLs if margin compresses.

## Conversion funnel
1. Anonymous → sign up (Clerk) → Free plan auto-provisioned (`app_users`).
2. Free user hits a Pro-gated feature or the 20/day quota → upgrade prompt → `/pricing`.
3. Stripe Checkout → webhook → `subscriptions` + `app_users.plan = 'pro'`.
4. Manage/cancel via Stripe Billing Portal (`/account/billing`).

Track conversion rate (Pro / total users) on the admin overview.

## Future monetization
- Annual Pro plan (add a second Stripe price id + plan mapping).
- Usage-based add-ons (extra request packs) — extend `plans.ts` + checkout.
- Team/seat plans.
