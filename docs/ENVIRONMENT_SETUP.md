# FMF Terminal — Environment Setup

This guide explains every environment variable: which service it belongs to,
where to obtain it, whether it's required, and an example value.

## Quick start
```bash
cp .env.local.example .env.local
# fill in values
npm run dev
```

All integrations are **env-guarded**: if a section's keys are missing, that
feature degrades gracefully and the app still builds/runs. For a full SaaS
launch, set everything in the **Required** section.

> **Secrets hygiene:** anything prefixed `NEXT_PUBLIC_` is exposed to the
> browser. Never put a secret (service role key, Stripe/Clerk secret, webhook
> secret, API keys) behind a `NEXT_PUBLIC_` name. Never commit `.env.local`.

---

## Required

### Supabase — database + existing community/watchlist/auth
| Variable | Public? | Where to obtain |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | same page → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | same page → Project API keys → `service_role` |

- **Service:** [Supabase](https://supabase.com/dashboard)
- **Required:** Yes. The anon URL + key power the existing browser features
  (community, watchlist sync, Supabase auth). The service role key powers
  server-only SaaS bookkeeping (`app_users`, `usage_events`, `subscriptions`,
  `app_roles`, `audit_logs`).
- **Examples:**
  - `NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example`
  - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example`
- **Note:** the service-role client also accepts `SUPABASE_URL` (see Optional),
  but the browser client always needs `NEXT_PUBLIC_SUPABASE_URL`.

### OpenAI — AI Intelligence Layer + Market Summary
| Variable | Public? | Where to obtain |
|---|---|---|
| `OPENAI_API_KEY` | **Secret** | platform.openai.com → API keys → Create new secret key |

- **Service:** [OpenAI](https://platform.openai.com/api-keys)
- **Required:** Yes — all AI features (Explain Move, Research Reports, Earnings
  Analysis, News Intelligence, Market Summary) need it.
- **Example:** `OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx`

### Clerk — authentication
| Variable | Public? | Where to obtain |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk Dashboard → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | **Secret** | Clerk Dashboard → API Keys → Secret key |

- **Service:** [Clerk](https://dashboard.clerk.com)
- **Required:** Yes for the SaaS auth layer (login, signup, sessions, route
  protection, AI request authorization). Without it the app runs in public mode.
- **Examples:**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx`
  - `CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx`

### Stripe — billing
| Variable | Public? | Where to obtain |
|---|---|---|
| `STRIPE_SECRET_KEY` | **Secret** | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | **Secret** | Stripe → Developers → Webhooks → your endpoint → Signing secret |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | Public | Stripe → Product catalog → Pro product → monthly Price → API ID (`price_…`) |

- **Service:** [Stripe](https://dashboard.stripe.com)
- **Required:** Yes for subscriptions. **All three** are needed — checkout is
  disabled unless `STRIPE_SECRET_KEY` **and** `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
  are both set; the webhook secret is needed to sync subscription status.
- **Webhook endpoint:** `https://<your-app>/api/webhooks/stripe` — subscribe to
  `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`.
- **Examples:**
  - `STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx`
  - `STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxx`

### Upstash Redis — daily quotas + rate limiting + AI cache
| Variable | Public? | Where to obtain |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | **Secret** | Upstash Console → your Redis DB → REST API → `UPSTASH_REDIS_REST_URL` |
| `UPSTASH_REDIS_REST_TOKEN` | **Secret** | same page → `UPSTASH_REDIS_REST_TOKEN` |

- **Service:** [Upstash](https://console.upstash.com)
- **Required:** Yes in production — daily quotas and distributed rate limiting
  rely on it. Without it, quotas fall back to per-instance memory (not enforced
  across serverless instances).
- **Examples:**
  - `UPSTASH_REDIS_REST_URL=https://your-db-12345.upstash.io`
  - `UPSTASH_REDIS_REST_TOKEN=AXXXAAIjcDExxxxxxxxxxxx`

---

## Recommended

### Public site / app URL
| Variable | Public? | Service | Required |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public | n/a | Recommended |
| `NEXT_PUBLIC_APP_URL` | Public | n/a | Recommended |

- **Purpose:** canonical URLs, OG tags, sitemap, and Stripe/Clerk redirect
  targets. `NEXT_PUBLIC_APP_URL` overrides `NEXT_PUBLIC_SITE_URL` for billing
  redirects; if neither is set the app falls back to `VERCEL_URL` then localhost.
- **Example:** `NEXT_PUBLIC_APP_URL=https://www.fmfterminal.com`

### Clerk webhook — profile sync
| Variable | Public? | Service | Required |
|---|---|---|---|
| `CLERK_WEBHOOK_SIGNING_SECRET` | **Secret** | Clerk | Recommended |

- **Where:** Clerk Dashboard → Webhooks → add endpoint
  `https://<your-app>/api/webhooks/clerk` (events `user.created`,
  `user.updated`, `user.deleted`) → copy the Signing Secret.
- **Purpose:** keeps the `app_users` table in sync on signup/update/delete.
  Without it, a user row is still created lazily on their first authenticated
  request, so it's recommended rather than strictly required.
- **Example:** `CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxx`

### Admin access
| Variable | Public? | Service | Required |
|---|---|---|---|
| `ADMIN_CLERK_USER_IDS` | Server | Clerk (IDs) | Recommended |

- **Where:** Clerk Dashboard → Users → open your user → copy the `user_…` id.
  Comma-separate multiple ids.
- **Purpose:** grants access to `/admin` and `/admin/cost`. Alternatively insert
  rows into the `app_roles` table with `role='admin'`.
- **Example:** `ADMIN_CLERK_USER_IDS=user_2abc...,user_2def...`

### Market data providers
| Variable | Public? | Service | Required |
|---|---|---|---|
| `FINNHUB_API_KEY` | **Secret** | Finnhub | Recommended |
| `TWELVE_DATA_API_KEY` | **Secret** | Twelve Data | Recommended |

- **Where:** [Finnhub Dashboard](https://finnhub.io/dashboard) /
  [Twelve Data API keys](https://twelvedata.com/account/api-keys).
- **Purpose:** candles + AI context (news, fundamentals, sectors). Yahoo/Binance
  public endpoints need no key, so the app partially works without these.
- **Examples:** `FINNHUB_API_KEY=xxxx` · `TWELVE_DATA_API_KEY=xxxx`

---

## Optional

### Clerk hosted route overrides
| Variable | Default | Service |
|---|---|---|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Clerk |

- Only set these if you relocate the auth pages.

### OpenAI model overrides
| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_MODEL` | `gpt-4o-mini` | Market summary model |
| `OPENAI_FAST_MODEL` | `gpt-4.1-mini` | News + explain-move |
| `OPENAI_DEEP_MODEL` | `gpt-5` | Research reports + earnings |
| `OPENAI_FALLBACK_MODEL` | `gpt-4o-mini` | Final failover |

- **Service:** OpenAI. Set only to pin specific models your account can access.

### Supabase server URL alias
| Variable | Service | Purpose |
|---|---|---|
| `SUPABASE_URL` | Supabase | Server-side alias for `NEXT_PUBLIC_SUPABASE_URL` |

- The service-role client accepts `SUPABASE_URL` if you prefer a non-public name.
  The browser client still requires `NEXT_PUBLIC_SUPABASE_URL`.

### Vercel KV aliases
| Variable | Service | Purpose |
|---|---|---|
| `KV_REST_API_URL` | Vercel KV / Upstash | Alias for `UPSTASH_REDIS_REST_URL` |
| `KV_REST_API_TOKEN` | Vercel KV / Upstash | Alias for `UPSTASH_REDIS_REST_TOKEN` |

- If you provision **Vercel KV** instead of Upstash directly, these aliases back
  the AI cache, quotas, and rate limiting.

---

## Summary table

| Variable | Service | Tier |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Required |
| `OPENAI_API_KEY` | OpenAI | Required |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Required |
| `CLERK_SECRET_KEY` | Clerk | Required |
| `STRIPE_SECRET_KEY` | Stripe | Required |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Required |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | Stripe | Required |
| `UPSTASH_REDIS_REST_URL` | Upstash | Required |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Required |
| `NEXT_PUBLIC_SITE_URL` | — | Recommended |
| `NEXT_PUBLIC_APP_URL` | — | Recommended |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk | Recommended |
| `ADMIN_CLERK_USER_IDS` | Clerk | Recommended |
| `FINNHUB_API_KEY` | Finnhub | Recommended |
| `TWELVE_DATA_API_KEY` | Twelve Data | Recommended |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk | Optional |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk | Optional |
| `OPENAI_MODEL` / `OPENAI_FAST_MODEL` / `OPENAI_DEEP_MODEL` / `OPENAI_FALLBACK_MODEL` | OpenAI | Optional |
| `SUPABASE_URL` | Supabase | Optional |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV / Upstash | Optional |

See `docs/OPERATIONS_RUNBOOK.md` for deployment + webhook registration steps.
