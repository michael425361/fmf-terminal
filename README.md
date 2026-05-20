# FMF Trade Assistant

AI-powered multi-asset trading dashboard (mock data).

## Markets

US equities, A-shares, options, forex, commodities, crypto.

## Dashboard (home page)

- Top ticker bar: **SPY, QQQ, BTC, GOLD, VIX**
- Watchlist (multi-asset mock quotes)
- AI market summary panel
- Economic calendar
- Mock SPY chart
- Responsive: desktop terminal layout + mobile bottom nav

## Run locally

Requires [Node.js](https://nodejs.org/) (includes npm).

```bash
cd "D:\FMF app"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/en`).

## Internationalization (i18n)

- **Library:** [next-intl](https://next-intl-docs.vercel.app/)
- **Locales:** `en` (default), `zh`
- **Routes:** `/en`, `/zh` (e.g. [http://localhost:3000/en](http://localhost:3000/en))
- **Translations:** `messages/en.json`, `messages/zh.json`
- **Config:** `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`
- **Language switcher:** top navbar (EN / 中文)

To add a new language: add a locale in `src/i18n/routing.ts`, create `messages/<locale>.json`, and add a label under `language` in each JSON file.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Lucide icons
