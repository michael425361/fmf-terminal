# FMF Terminal — Launch Checklist

## Pre-flight (engineering)
- [ ] `npm install` clean
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `npm run test:coverage` passes (>90%)
- [ ] No critical `npm audit` vulnerabilities

## Accounts & secrets
- [ ] Clerk app created; publishable + secret keys set
- [ ] Clerk sign-in/up URLs configured (`/sign-in`, `/sign-up`)
- [ ] Clerk webhook → `/api/webhooks/clerk`; `CLERK_WEBHOOK_SIGNING_SECRET` set
- [ ] Supabase project; migrations 007–011 applied
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only)
- [ ] Stripe Pro product + monthly price; `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` set
- [ ] Stripe webhook → `/api/webhooks/stripe`; `STRIPE_WEBHOOK_SECRET` set
- [ ] Stripe Billing Portal enabled
- [ ] Upstash Redis provisioned; `UPSTASH_REDIS_REST_*` set
- [ ] `OPENAI_API_KEY` set (+ model overrides if needed)
- [ ] `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` set to production URL
- [ ] `ADMIN_CLERK_USER_IDS` set for admin access

## Functional verification (post-deploy)
- [ ] Sign up → `app_users` row created
- [ ] Sign in / sign out works; protected routes redirect when signed out
- [ ] AI feature works for Free user; row appears in `usage_events`
- [ ] Free plan blocked from Research Reports / Earnings (403 + upgrade prompt)
- [ ] Free daily limit (20) returns 429 with friendly upgrade message
- [ ] Burst rate limit triggers 429 under rapid requests
- [ ] Upgrade via Checkout → `subscriptions` + `app_users.plan='pro'`
- [ ] Pro user has unlimited Research/Earnings within 500/day
- [ ] Billing Portal opens from `/account/billing`
- [ ] Cancel in portal → subscription reflects `cancel_at_period_end`
- [ ] `/admin` overview renders for admins; blocked for non-admins
- [ ] `/admin/cost` renders spend by model/feature/day

## Security
- [ ] No secret keys exposed as `NEXT_PUBLIC_*`
- [ ] Webhook signature verification confirmed (Stripe + Clerk)
- [ ] RLS enabled on all new tables (service-role only)
- [ ] AI routes reject anonymous requests when Clerk is enabled
- [ ] Security headers present (next.config.ts)
- [ ] `audit_logs` capturing rate-limit / gating / quota events

## Backward compatibility
- [ ] Existing community + watchlist features still work
- [ ] App still builds/runs with SaaS env vars absent (degraded mode)

## Observability
- [ ] Logs visible in Vercel; `captureError` wired to a monitor (optional)
- [ ] Cost dashboard reviewed; AI gross margin positive

## Go / no-go
- [ ] All above checked → **GO**
