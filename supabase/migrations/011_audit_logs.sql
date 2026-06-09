-- Phase 3 / M9: security audit log.

create table if not exists public.audit_logs (
  id            bigint generated always as identity primary key,
  clerk_user_id text,
  action        text not null,
  resource      text,
  metadata      jsonb,
  ip            text,
  created_at    timestamptz not null default now()
);

create index if not exists audit_logs_user_idx
  on public.audit_logs (clerk_user_id, created_at desc);
create index if not exists audit_logs_action_idx
  on public.audit_logs (action, created_at desc);

alter table public.audit_logs enable row level security;
-- Service-role only (no public policies).
