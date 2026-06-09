# FMF Terminal — Operations Runbook

## Environment variables
See `.env.example`. Production-critical for SaaS:

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Auth routes |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk → `app_users` sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Server SaaS bookkeeping (server-only!) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | Billing |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`) | Quotas + rate limiting + cache |
| `NEXT_PUBLIC_APP_URL` | Stripe/Clerk redirects |
| `ADMIN_CLERK_USER_IDS` | Bootstrap admin access |
| `OPENAI_API_KEY` (+ model overrides) | AI engines |

> `SUPABASE_SERVICE_ROLE_KEY` and `*_SECRET*` must never be `NEXT_PUBLIC_`.

## Database migrations
Apply in order via the Supabase SQL editor or CLI:
```
supabase/migrations/007_app_users.sql
supabase/migrations/008_usage_events.sql
supabase/migrations/009_subscriptions.sql
supabase/migrations/010_admin_roles.sql      # tables + analytics views
supabase/migrations/011_audit_logs.sql
```
All are additive and use service-role-only RLS. Existing tables are untouched.

## Third-party setup
### Clerk
1. Create app → copy publishable + secret keys.
2. Set sign-in/up URLs to `/sign-in`, `/sign-up`.
3. Create a webhook → `https://<app>/api/webhooks/clerk` for
   `user.created`, `user.updated`, `user.deleted` → copy signing secret to
   `CLERK_WEBHOOK_SIGNING_SECRET`.

### Stripe
1. Create the Pro product + monthly price → set `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`.
2. Create webhook → `https://<app>/api/webhooks/stripe` for
   `checkout.session.completed`, `customer.subscription.created|updated|deleted`
   → copy signing secret to `STRIPE_WEBHOOK_SECRET`.
3. Enable the Billing Portal in Stripe settings.

### Upstash Redis
Provision a database → copy REST URL + token.

## Vercel deployment
1. Set all env vars in Project Settings (Production + Preview).
2. Deploy. Verify build is green (it is even without secrets — degraded mode).
3. Register the Clerk + Stripe webhooks against the deployed URL.
4. Add your Clerk user id to `ADMIN_CLERK_USER_IDS` to access `/admin`.
5. (Optional) Add a Vercel Cron if you later add a rollup endpoint; the analytics
   views currently aggregate live, so no cron is required.

## Verifying a healthy deploy
- Sign up → confirm a row appears in `app_users`.
- Call an AI feature → confirm a row in `usage_events`.
- Hit the Free daily limit → expect HTTP 429 with an upgrade message.
- Upgrade via Checkout → confirm `subscriptions` row + `app_users.plan = 'pro'`.
- Visit `/admin` (as admin) and `/admin/cost` → metrics render.

## Monitoring
- Structured JSON logs via `src/lib/observability/logger.ts` (parseable by Vercel
  log drains). `captureError` is the single hook to wire Sentry/Datadog.
- `audit_logs` records `rate_limited`, `feature_locked`, `quota_exceeded`.

## Common incidents
| Symptom | Likely cause | Action |
|---|---|---|
| AI routes return 401 | Clerk configured but user not signed in | Expected; sign in |
| Quotas not enforced | Redis not configured | Set `UPSTASH_REDIS_REST_*` |
| Plan not upgrading after payment | Stripe webhook failing | Check webhook secret + Stripe dashboard delivery logs |
| `/admin` shows "no access" | Not in `app_roles`/`ADMIN_CLERK_USER_IDS` | Add the Clerk user id |
| Metrics empty | `SUPABASE_SERVICE_ROLE_KEY` missing | Set service role key |
