-- =============================================================================
-- FMF Terminal — fix public.posts RLS (posts must be readable like comments)
-- Run in Supabase SQL Editor if posts vanish after refresh but comments work.
-- Safe to re-run (drops/recreates policies + re-grants).
-- =============================================================================

-- Ensure table exists (no-op if already applied from 003_posts.sql)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  category text not null check (category in ('us', 'cn', 'daily')),
  title text not null,
  content text not null,
  ticker_tags text[] not null default '{}',
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  view_count integer not null default 0 check (view_count >= 0)
);

-- -----------------------------------------------------------------------------
-- 1. Enable RLS
-- -----------------------------------------------------------------------------
alter table public.posts enable row level security;

-- -----------------------------------------------------------------------------
-- 2. Drop ALL existing policies on posts (stale/restrictive policies cause empty feeds)
-- -----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'posts'
  loop
    execute format('drop policy if exists %I on public.posts', pol.policyname);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Required policies (mirror working comments table pattern)
-- -----------------------------------------------------------------------------

-- SELECT: anon + authenticated can read every post
create policy "posts_select_anon"
  on public.posts
  for select
  to anon
  using (true);

create policy "posts_select_authenticated"
  on public.posts
  for select
  to authenticated
  using (true);

-- INSERT: authenticated users only, must own the row
create policy "posts_insert_authenticated"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: creator only
create policy "posts_update_own"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: creator only
create policy "posts_delete_own"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Grants (API roles must have table-level permission; RLS filters rows)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Verify (run manually in SQL editor after migration)
-- -----------------------------------------------------------------------------
-- select count(*) from public.posts;
-- set role anon; select count(*) from public.posts; reset role;
