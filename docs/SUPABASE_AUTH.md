# Supabase Auth setup (FMF Terminal)

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Copy **Project URL** and **anon public** key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 2. Configure redirect URLs

In **Authentication → URL Configuration**, add:

| Environment | Site URL | Redirect URLs |
|-------------|----------|---------------|
| Local | `http://localhost:3000` | `http://localhost:3000/auth/callback` |
| Production | `https://www.fmfterminal.com` | `https://www.fmfterminal.com/auth/callback` |

## 3. Enable providers

In **Authentication → Providers**:

- **Email** — enabled (password sign-in / sign-up)
- **Google** — enable and add OAuth client ID/secret from Google Cloud Console
- **Apple** — enable and configure Apple Developer credentials

## 4. Email templates (optional)

Customize confirmation and magic-link emails under **Authentication → Email Templates**.

## 5. Run locally

```bash
npm run dev
```

Open Community or tap **Sign in**. OAuth returns to `/auth/callback`, then redirects back to your current locale path.

## Profiles table

Run the SQL migration in Supabase SQL Editor:

**File:** `supabase/migrations/001_profiles.sql`

This creates:

- `public.profiles` (`id`, `username`, `avatar_url`, `bio`, `created_at`)
- RLS policies (public read, users insert/update/delete own row)
- Trigger `on_auth_user_created` → auto-insert `FMF_Trader_XXXX` username
- Backfill for existing `auth.users`

After running SQL, sign out and sign in again to load your profile row.

For avatar uploads, also run `supabase/migrations/002_avatars_storage.sql` — see [SUPABASE_AVATARS.md](./SUPABASE_AVATARS.md).

## Architecture

| File | Role |
|------|------|
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server Components / route handlers |
| `src/lib/supabase/middleware.ts` | Session cookie refresh |
| `src/app/auth/callback/route.ts` | OAuth code exchange |
| `src/providers/AuthProvider.tsx` | Session state + auth modal |
| `src/lib/auth/profile.ts` | `UserProfile` view model |
| `src/lib/auth/profiles.ts` | Fetch / ensure profile from `public.profiles` |
| `supabase/migrations/001_profiles.sql` | Table, RLS, trigger, backfill |
| `src/components/auth/AuthProfileMenu.tsx` | Avatar dropdown (username, sign out) |

Protected actions (open auth modal when signed out):

- Create post
- Comment / reply
- Add to watchlist (favorites)
