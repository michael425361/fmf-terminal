-- =============================================================================
-- FMF Terminal — comments, likes, bookmarks, cloud watchlist
-- Run after 001_profiles.sql and 003_posts.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Comments
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);

alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select to anon, authenticated using (true);

drop policy if exists "Authenticated users can insert comments" on public.comments;
create policy "Authenticated users can insert comments"
  on public.comments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. Post likes
-- -----------------------------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_id_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

drop policy if exists "Post likes are viewable by everyone" on public.post_likes;
create policy "Post likes are viewable by everyone"
  on public.post_likes for select to anon, authenticated using (true);

drop policy if exists "Authenticated users can like posts" on public.post_likes;
create policy "Authenticated users can like posts"
  on public.post_likes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike own likes" on public.post_likes;
create policy "Users can unlike own likes"
  on public.post_likes for delete to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Bookmarks (saved posts)
-- -----------------------------------------------------------------------------
create table if not exists public.bookmarks (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);

alter table public.bookmarks enable row level security;

drop policy if exists "Users read own bookmarks" on public.bookmarks;
create policy "Users read own bookmarks"
  on public.bookmarks for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own bookmarks" on public.bookmarks;
create policy "Users insert own bookmarks"
  on public.bookmarks for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own bookmarks" on public.bookmarks;
create policy "Users delete own bookmarks"
  on public.bookmarks for delete to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Cloud watchlist (symbol = catalog asset id or ticker, e.g. etf-spy / AAPL)
-- -----------------------------------------------------------------------------
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint watchlists_user_symbol_unique unique (user_id, symbol)
);

create index if not exists watchlists_user_id_idx on public.watchlists (user_id);

alter table public.watchlists enable row level security;

drop policy if exists "Users manage own watchlist" on public.watchlists;
create policy "Users manage own watchlist"
  on public.watchlists for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. Sync denormalized counts on posts
-- -----------------------------------------------------------------------------
create or replace function public.bump_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set comment_count = greatest(0, comment_count - 1)
    where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_bump_post_count on public.comments;
create trigger comments_bump_post_count
  after insert or delete on public.comments
  for each row execute function public.bump_post_comment_count();

create or replace function public.bump_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set like_count = greatest(0, like_count - 1)
    where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_bump_count on public.post_likes;
create trigger post_likes_bump_count
  after insert or delete on public.post_likes
  for each row execute function public.bump_post_like_count();

-- -----------------------------------------------------------------------------
-- 6. Grants
-- -----------------------------------------------------------------------------
grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;

grant select on public.post_likes to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;

grant select, insert, delete on public.bookmarks to authenticated;

grant select, insert, update, delete on public.watchlists to authenticated;
