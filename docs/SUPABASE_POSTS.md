# Community posts (Supabase)

## Run migrations (in order)

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/003_posts.sql`
3. **`supabase/migrations/005_fix_posts_rls.sql`** — run this if posts disappear after refresh but comments work

## Table: `public.posts`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| created_at | timestamptz | Newest first in feed |
| user_id | uuid | FK → `auth.users` |
| category | text | `us` \| `cn` \| `daily` |
| title, content | text | |
| like_count, comment_count, view_count | int | Denormalized counts |

## Required RLS policies

| Operation | Who | Rule |
|-----------|-----|------|
| SELECT | `anon`, `authenticated` | `using (true)` — everyone reads all posts |
| INSERT | `authenticated` | `with check (auth.uid() = user_id)` |
| UPDATE | `authenticated` | own row only |
| DELETE | `authenticated` | own row only |

RLS blocks reads **silently** (0 rows, no error). Comments work but posts empty → run `005_fix_posts_rls.sql`.

## Verify in SQL Editor

```sql
select count(*) from public.posts;

-- simulate anon API role
set role anon;
select count(*) from public.posts;
reset role;
```

Both counts should match. If anon returns 0, SELECT policy is missing.

## App logging

Browser console (always logs errors, not only dev):

- `[community] fetchPosts` — row count or RLS diagnostic
- `[community] createPost.insert` / `createPost.verifyRead`
- `[community] likePost` / `batchHasLiked`

## App API (`src/lib/community/posts.ts`)

- `fetchPosts(category)` — `order by created_at desc`
- `createPost(draft, author)` — verifies row is readable after insert
- `fetchPostById(postId)`
