# AI Market Summary

## Setup

Add to `.env.local`:

```env
OPENAI_API_KEY=sk-...
# Optional:
OPENAI_MODEL=gpt-4o-mini
```

Restart `npm run dev`.

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

Server caches per `symbol|market` for **5 minutes**. Pass `?refresh=1` or header `X-Skip-Cache: 1` to bypass.

## UI

`AISummaryCard` renders below `TradingChart` (hidden in chart fullscreen).
