-- Phase 3 / M2: SaaS user records keyed by Clerk user id.
-- Additive: does NOT touch the existing `profiles` table (Supabase-auth keyed)
-- so community/watchlist functionality keeps working unchanged.

create table if not exists public.app_users (
  clerk_user_id      text primary key,
  email              text,
  plan               text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  created_at         timestamptz not null default now(),
  last_active_at     timestamptz not null default now()
);

create index if not exists app_users_plan_idx on public.app_users (plan);
create index if not exists app_users_created_at_idx on public.app_users (created_at);
create index if not exists app_users_stripe_customer_idx
  on public.app_users (stripe_customer_id);

-- Service-role only: written exclusively by the server (service key bypasses RLS).
alter table public.app_users enable row level security;

-- No anon/authenticated policies -> browser clients cannot read or write.
-- (Server uses the service role key which bypasses RLS entirely.)
