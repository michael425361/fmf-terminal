# FMF Terminal — Production Deployment

**Product:** FMF Terminal  
**Meaning:** FMF = For My Finance  
**Production URL:** https://www.fmfterminal.com

---

## 1. Deploy to Vercel

### Prerequisites

- [Vercel](https://vercel.com) account
- Git repository with this project
- Domain access for `fmfterminal.com`

### Steps

1. **Import the project**
   - Vercel Dashboard → **Add New** → **Project**
   - Import your Git repository (`D:\FMF app` or remote)

2. **Framework preset**
   - Vercel auto-detects **Next.js**
   - Build command: `npm run build` (default)
   - Output: Next.js default (`.next`)

3. **Environment variables** (Project → Settings → Environment Variables)

   | Name | Value | Environments |
   |------|--------|--------------|
   | `NEXT_PUBLIC_SITE_URL` | `https://www.fmfterminal.com` | Production |

   Copy from `.env.example` for local development:

   ```bash
   cp .env.example .env.local
   ```

4. **Deploy**
   - Click **Deploy**
   - Vercel provides HTTPS on `*.vercel.app` immediately

5. **Verify**
   - Open the deployment URL
   - Confirm `/en` and `/zh` load
   - Check `/robots.txt` and `/sitemap.xml`

---

## 2. Connect fmfterminal.com

### Add custom domains in Vercel

1. Project → **Settings** → **Domains**
2. Add:
   - `www.fmfterminal.com` (primary)
   - `fmfterminal.com` (apex — redirect to www recommended)

3. Vercel shows required DNS records after you add each domain.

---

## 3. DNS configuration

Configure at your domain registrar (e.g. GoDaddy, Cloudflare, Route53).

### Recommended (Vercel nameservers)

Point the domain to Vercel DNS for simplest SSL and routing:

| Type | Name | Value |
|------|------|--------|
| NS | `@` | Vercel nameservers (from Domains panel) |

### Alternative (external DNS)

**WWW subdomain:**

| Type | Name | Value |
|------|------|--------|
| CNAME | `www` | `cname.vercel-dns.com` |

**Apex domain (`fmfterminal.com`):**

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |

*(Confirm current Vercel apex IP in the Domains panel — it may change.)*

**Redirect apex → www (optional):**

In Vercel Domains, set `fmfterminal.com` to redirect to `https://www.fmfterminal.com`.

---

## 4. SSL setup

- Vercel provisions **Let's Encrypt** certificates automatically
- HTTPS is enabled once DNS propagates (usually minutes to 48 hours)
- `Strict-Transport-Security` is set via `vercel.json` and `next.config.ts`
- No manual certificate upload required for standard deployments

---

## 5. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical base URL for SEO, OG, sitemap |

**Production value:**

```
NEXT_PUBLIC_SITE_URL=https://www.fmfterminal.com
```

**Preview deployments:** Optional — omit or use the Vercel preview URL if you need correct OG tags on previews.

---

## 6. Production workflow

### Branch strategy

| Branch | Vercel | URL |
|--------|--------|-----|
| `main` | Production | https://www.fmfterminal.com |
| PR branches | Preview | `*.vercel.app` |

### Release checklist

- [ ] `npm run build` passes locally
- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel Production
- [ ] Custom domain shows **Valid** in Vercel Domains
- [ ] `/en` dashboard loads with live market data
- [ ] Favicon and OG image load from `/brand/`
- [ ] `robots.txt` and `sitemap.xml` reference `fmfterminal.com`

### Commands

```bash
npm install
npm run build    # production build
npm run start    # local production server
npm run dev      # development
```

---

## Production features included

| Feature | Location |
|---------|----------|
| Security headers | `vercel.json`, `next.config.ts` |
| Image optimization | `next.config.ts` (AVIF/WebP) |
| Lazy-loaded logos | `FMFLogo.tsx` |
| Static asset caching | `vercel.json` |
| SEO sitemap | `src/app/sitemap.ts` |
| robots.txt | `src/app/robots.ts` |
| PWA manifest | `public/manifest.webmanifest` |
| Sydney region | `vercel.json` (`syd1`) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Wrong canonical URL in meta tags | Set `NEXT_PUBLIC_SITE_URL` and redeploy |
| Domain not verifying | Wait for DNS propagation; use `dig www.fmfterminal.com` |
| API routes 404 on Vercel | Ensure `src/app/api/**` is committed; no `output: 'export'` |
| Locale redirect loop | Middleware handles `/` → `/en`; do not add conflicting redirects |

---

## Support

- Vercel docs: https://vercel.com/docs
- Next.js deployment: https://nextjs.org/docs/app/building-your-application/deploying

**FMF Terminal** — For My Finance · https://www.fmfterminal.com
