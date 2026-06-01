# Dupe Economy

Dupe Economy is a Next.js app for tracking prestige products and the lower-cost alternatives that appear around them. It ships with a seeded SQLite/libSQL dataset and can run a Gemini-powered scan to add current fashion, beauty, skincare, and haircare signals.

The app is intentionally small: a dashboard, a weekly scan flow, scan history, and a market-response view.

## What It Does

- Shows seeded and scan-discovered products by category.
- Sorts products by observed price differential.
- Runs a two-stage Gemini scan with Google Search grounding:
  - discovery of recently viral products and known alternatives
  - deeper market signals such as brand responses, acquisitions, declining trends, and mass-market launches
- Stores scan runs, findings, products, and mass-market signals in libSQL.
- Falls back to a local `dupe-economy.db` file when Turso variables are not set.

## Tech Stack

- Next.js 14 App Router
- React 18
- Tailwind CSS 4
- libSQL/Turso via `@libsql/client`
- Gemini 2.0 Flash via `@google/generative-ai`

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
GEMINI_API_KEY=your-gemini-api-key

# Optional. If omitted, the app uses file:dupe-economy.db locally.
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`. The home route redirects to `/intelligence`.

The database schema is created lazily on first API request, and the seed product dataset is inserted if the `products` table is empty.

## Pages

- `/intelligence` - product intelligence dashboard with category filters and price-differential sorting
- `/scan` - run the current scan and view newly discovered products, findings, and mass-market responses
- `/archive` - previous scan runs and findings
- `/market-responses` - grouped mass-market response signals by responding brand

## API Routes

- `GET /api/products` - list products
- `GET /api/products?category=fashion` - filter by category
- `GET /api/products?discovered_by=scan` - filter by source
- `POST /api/scan` - run discovery and depth scans
- `GET /api/scan/latest` - latest completed scan
- `GET /api/history` - all scan runs with findings
- `GET /api/findings/:scanId` - findings for one scan
- `GET /api/market-responses` - all mass-market response signals
- `GET /api/market-responses?brand=ELF` - filter response signals by responding brand

## Scan Behavior

`POST /api/scan` requires `GEMINI_API_KEY`. If a completed scan exists from the past 6 hours, the route returns the cached scan instead of running another one.

Scans are best-effort. Discovery and depth run independently, so one stage can fail while the other still records data. A scan is marked `failed` only if both stages fail.

## Database Tables

- `products`
- `scan_runs`
- `findings`
- `mass_market_signals`

The schema lives in `lib/schema.js`; query helpers live in `lib/queries.js`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deployment Notes

For Vercel, set these environment variables in the project settings:

```bash
GEMINI_API_KEY=...
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

Use Turso or another libSQL-compatible remote database for deployed environments. The local file fallback is meant for development.
