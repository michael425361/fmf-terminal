-- =============================================================================
-- FMF Terminal — comment replies (parent_id) + comment_likes
-- Run after 004_comments_likes_watchlist.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Threaded replies
-- -----------------------------------------------------------------------------
alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

create index if not exists comments_parent_id_idx on public.comments (parent_id);

-- -----------------------------------------------------------------------------
-- 2. Comment likes
-- -----------------------------------------------------------------------------
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_id_idx on public.comment_likes (user_id);
create index if not exists comment_likes_comment_id_idx on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

drop policy if exists "Comment likes are viewable by everyone" on public.comment_likes;
create policy "Comment likes are viewable by everyone"
  on public.comment_likes for select to anon, authenticated using (true);

drop policy if exists "Authenticated users can like comments" on public.comment_likes;
create policy "Authenticated users can like comments"
  on public.comment_likes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike own comment likes" on public.comment_likes;
create policy "Users can unlike own comment likes"
  on public.comment_likes for delete to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Grants
-- -----------------------------------------------------------------------------
grant select on public.comment_likes to anon, authenticated;
grant insert, delete on public.comment_likes to authenticated;
