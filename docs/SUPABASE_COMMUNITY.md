# Supabase — community interactions & cloud watchlist

Run in the Supabase SQL Editor **after** `001_profiles.sql` and `003_posts.sql`:

```
supabase/migrations/004_comments_likes_watchlist.sql
```

## Tables

| Table | Purpose |
|-------|---------|
| `comments` | Post comments (flat, no threading) |
| `post_likes` | One row per user like; triggers bump `posts.like_count` |
| `bookmarks` | Saved posts per user |
| `watchlists` | Cloud symbols per user (`symbol` = catalog asset id, e.g. `etf-spy`) |

## App modules

- `src/lib/community/comments.ts` — `getComments`, `createComment`, `deleteComment`
- `src/lib/community/likes.ts` — like/unlike + batch checks
- `src/lib/community/bookmarks.ts` — bookmark/unbookmark
- `src/lib/watchlist/watchlist.ts` — cloud watchlist CRUD

## Verification

1. Run the migration
2. Restart `npm run dev`
3. Sign in, like/comment/bookmark a post, refresh — counts and state persist
4. Add symbols to watchlist on one device; sign in on another — list restores
