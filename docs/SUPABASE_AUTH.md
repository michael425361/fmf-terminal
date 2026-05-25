# Supabase Auth setup (FMF Terminal)

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Copy **Project URL** and **anon public** key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://www.fmfterminal.com
```

## 2. Configure redirect URLs

In **Authentication → URL Configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** (local) | `http://localhost:3000` |
| **Site URL** (production) | `https://www.fmfterminal.com` |

**Redirect URLs** — add every origin/port you use (Supabase must match exactly):

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
http://localhost:3003/auth/callback
http://localhost:3004/auth/callback
https://www.fmfterminal.com/auth/callback
```

Tip: If your dev server picks another port (e.g. 3004 because 3000 is busy), that exact callback URL must be listed or OAuth will fail with *redirect URL mismatch*.

## 3. Enable providers

In **Authentication → Providers**:

| Provider | Required |
|----------|----------|
| **Email** | Enabled (password sign-in / sign-up) |
| **Google** | Enabled + Client ID & Client Secret |
| **Apple** | Enabled + Apple Developer credentials |

## 4. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web).
2. **Authorized JavaScript origins** (optional for Supabase-hosted flow):
   - `http://localhost:3000` (and other local ports you use)
   - `https://www.fmfterminal.com`
3. **Authorized redirect URIs** (required):

```
https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
```

Use the exact callback URL from Supabase → Authentication → Providers → Google.

4. Paste Client ID and Client Secret into Supabase Google provider settings.

## 5. Apple Sign In

Apple requires:

- Apple Developer Program membership
- **Services ID** + **Sign in with Apple** key
- Domain & return URLs registered in Apple Developer

**Return URL in Apple Developer** (same as Google):

```
https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
```

**Localhost:** Apple often does not support `http://localhost` for Sign in with Apple. For local dev, use **Google** or **email**, or test Apple on production `https://www.fmfterminal.com`.

## 6. Run locally

```bash
npm run dev
```

Open the app, tap **Sign in** → **Continue with Google** / **Apple**.

Flow:

1. Browser → Google/Apple
2. Redirect → `https://xxxx.supabase.co/auth/v1/callback`
3. Redirect → `http://localhost:PORT/auth/callback?code=...&next=/en/...`
4. App exchanges code → session cookies → redirects to `next`

In development, the browser console logs `OAuth clicked: { provider, redirectTo, origin }`.

## 7. Profiles table

Run in Supabase SQL Editor:

- `supabase/migrations/001_profiles.sql`
- `supabase/migrations/002_avatars_storage.sql` (avatars)

## Architecture

| File | Role |
|------|------|
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server Components / route handlers |
| `src/lib/supabase/middleware.ts` | Session cookie refresh |
| `src/lib/auth/oauth.ts` | OAuth callback URL builder |
| `src/app/auth/callback/route.ts` | PKCE code exchange + cookie write on redirect |
| `src/components/auth/AuthModal.tsx` | `signInWithOAuth` + `window.location.assign(data.url)` |
| `src/providers/AuthProvider.tsx` | Session state + `auth_error` query handling |

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Button spins, nothing happens | `data.url` missing — providers disabled in Supabase |
| Redirect URL mismatch | Add exact `http://localhost:PORT/auth/callback` to Supabase |
| Returns logged out after OAuth | Callback cookies — fixed in `auth/callback/route.ts` (cookies on redirect response) |
| Apple fails on localhost | Apple requires HTTPS + registered domain — use production |
| `auth_error=1` in URL | Open browser console / server logs for `[auth/callback]` message |
