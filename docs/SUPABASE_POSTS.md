# Community posts (Supabase)

## Run migration

In **Supabase → SQL Editor**, run:

`supabase/migrations/003_posts.sql`

Requires `001_profiles.sql` (for authenticated users).

## Table: `public.posts`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK, default `gen_random_uuid()` |
| created_at | timestamptz | Sort key (newest first) |
| updated_at | timestamptz | Auto-updated on row change |
| user_id | uuid | FK → `auth.users` |
| username | text | Snapshot at post time |
| avatar_url | text | Snapshot at post time |
| category | text | `us` \| `cn` \| `daily` |
| title | text | |
| content | text | |
| ticker_tags | text[] | e.g. `{NVDA,TSLA}` |
| like_count | int | Default 0 |
| comment_count | int | Default 0 |
| view_count | int | Default 0 |

## RLS

- **SELECT** — everyone (anon + authenticated)
- **INSERT** — authenticated, `user_id = auth.uid()`
- **UPDATE / DELETE** — own rows only

## App API (`src/lib/community/posts.ts`)

- `fetchPosts(category)` — latest first
- `createPost(draft, author)` — insert with profile snapshot
- `deletePost(postId)` — owner only (RLS)
