# Avatar storage setup (FMF Terminal)

## 1. Run SQL migration

In **Supabase → SQL Editor**, run:

`supabase/migrations/002_avatars_storage.sql`

This creates:

- Public bucket **`avatars`** (5 MB limit, image MIME types)
- RLS: public read; authenticated users upload/update/delete only under `{user_id}/...`

## 2. Verify bucket (Dashboard)

**Storage → Buckets → avatars**

| Setting | Value |
|---------|--------|
| Public bucket | **On** |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| File size limit | 5 MB (optional; SQL sets 5 MB) |

## 3. How uploads work

- Path: `avatars/{user_id}/avatar-{timestamp}.jpg`
- Client compresses images to max **512px** edge, JPEG ~85% quality
- Public URL saved to `profiles.avatar_url`

## 4. Profile fields

| Column | Editable in app |
|--------|-----------------|
| `username` | Yes (3–24 chars, unique) |
| `bio` | Yes (max 160 chars) |
| `avatar_url` | Yes (via Storage upload) |

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Upload 403 | Re-run `002_avatars_storage.sql`; confirm user is logged in |
| Public URL 404 | Bucket must be **public** |
| Username taken | Pick another name; DB unique index on `username` |
