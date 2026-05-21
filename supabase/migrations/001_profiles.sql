-- =============================================================================
-- FMF Terminal — profiles table, RLS, auto-create on signup
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Public user profiles linked to auth.users';
comment on column public.profiles.username is 'Display handle, e.g. FMF_Trader_4821';

-- Unique usernames (case-sensitive; app generates FMF_Trader_XXXX)
create unique index if not exists profiles_username_unique on public.profiles (username);

-- -----------------------------------------------------------------------------
-- 2. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Anyone authenticated (and anon for public community reads) can read profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Users can create only their own row (fallback if trigger missed)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update only their own row
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can delete only their own row (optional account cleanup)
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 3. Default username generator (FMF_Trader_1234)
-- -----------------------------------------------------------------------------
create or replace function public.generate_default_username()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  suffix integer;
  candidate text;
  attempts integer := 0;
begin
  loop
    suffix := floor(random() * 9000 + 1000)::integer;
    candidate := 'FMF_Trader_' || suffix::text;
    exit when not exists (
      select 1 from public.profiles where username = candidate
    );
    attempts := attempts + 1;
    exit when attempts > 50;
  end loop;
  -- Last resort: include random tail from uuid
  candidate := 'FMF_Trader_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  return candidate;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Auto-create profile when a new auth user is created
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pic text;
begin
  pic := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    public.generate_default_username(),
    pic
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 5. Backfill profiles for existing auth users (run once after migration)
-- -----------------------------------------------------------------------------
insert into public.profiles (id, username, avatar_url)
select
  u.id,
  public.generate_default_username(),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- -----------------------------------------------------------------------------
-- 6. Grant API access
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;
