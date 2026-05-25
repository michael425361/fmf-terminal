# AI Market Summary

## Setup

1. Copy from `.env.example` into **`.env.local`** (Next.js only loads env from this file at dev start):

```env
OPENAI_API_KEY=sk-...
# Optional:
OPENAI_MODEL=gpt-4o-mini
```

2. **Restart** `npm run dev` after any `.env.local` change.

3. Terminal log should show: `[ai/market-summary] OPENAI_API_KEY prefix: sk-proj-ab` and `configured: true`.

If you see `configured: false`, the key is missing — UI will show “AI summary temporarily unavailable”.

## API

`POST /api/ai/market-summary`

Body:

```json
{
  "symbol": "AMD",
  "market": "us",
  "locale": "en",
  "quote": { "price": 120.5, "changePercent": 3.99 },
  "candles": [{ "time": 1710000000, "open": 1, "high": 1, "low": 1, "close": 1, "volume": 1000 }],
  "indicators": { "ma20": 118, "priceVsMa20": "above" }
}
```

Response:

```json
{
  "summary": "...",
  "sentiment": "bullish",
  "highlights": ["...", "..."],
  "cached": false,
  "generatedAt": 1710000000000
}
```

Server caches per `symbol|market|locale` (`en` / `zh`) for **5 minutes**. Pass `?refresh=1` or header `X-Skip-Cache: 1` to bypass.

Client sends `locale` in JSON body and `X-FMF-Locale` header from `next-intl` + pathname (`/zh/...`).

## UI

`AISummaryCard` renders below `TradingChart` (hidden in chart fullscreen).
