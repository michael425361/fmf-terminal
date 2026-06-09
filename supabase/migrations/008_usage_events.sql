-- Phase 3 / M3: append-only AI usage + cost ledger.

create table if not exists public.usage_events (
  id                 bigint generated always as identity primary key,
  clerk_user_id      text not null,
  endpoint           text not null,
  feature            text,
  model              text,
  prompt_tokens      integer not null default 0,
  completion_tokens  integer not null default 0,
  total_tokens       integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  cached             boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (clerk_user_id, created_at desc);
create index if not exists usage_events_created_idx
  on public.usage_events (created_at desc);
create index if not exists usage_events_feature_idx
  on public.usage_events (feature);
create index if not exists usage_events_model_idx
  on public.usage_events (model);

alter table public.usage_events enable row level security;
-- Service-role only (no public policies).
