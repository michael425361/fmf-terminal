-- Phase 3 / M5: Stripe subscription state, synced via webhooks.

create table if not exists public.subscriptions (
  clerk_user_id          text primary key,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

alter table public.subscriptions enable row level security;
-- Service-role only (no public policies).
