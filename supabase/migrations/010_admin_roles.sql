-- Phase 3 / M7: admin roles + analytics helper views.

create table if not exists public.app_roles (
  clerk_user_id text primary key,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

alter table public.app_roles enable row level security;
-- Service-role only (no public policies).

-- Daily usage / cost rollup for the cost analytics dashboard (M8).
create or replace view public.usage_daily_costs as
select
  date_trunc('day', created_at)::date as day,
  feature,
  model,
  count(*)                            as request_count,
  count(*) filter (where cached)      as cached_count,
  sum(total_tokens)                   as total_tokens,
  sum(estimated_cost_usd)             as estimated_cost_usd
from public.usage_events
group by 1, 2, 3;

-- Per-user daily usage for quota auditing / user analytics (M7).
create or replace view public.usage_daily_by_user as
select
  clerk_user_id,
  date_trunc('day', created_at)::date as day,
  count(*)                            as request_count,
  sum(estimated_cost_usd)             as estimated_cost_usd
from public.usage_events
group by 1, 2;
