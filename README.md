# Dupe Economy | Full-Stack Product Intelligence Platform

**Product Analyst / Product Strategy Project | May 2026**

Dupe Economy is a full-stack AI-powered market intelligence platform that tracks how viral fashion, beauty, skincare, and haircare products move through the dupe economy from prestige launch to mass-market imitation. The system combines product analytics, trend discovery, competitive intelligence, and automated reporting into one editorial-style dashboard for analyzing consumer behavior and market response patterns.

## Key Contributions

- Designed and implemented an end-to-end intelligence pipeline using **Next.js**, **Turso SQLite**, **Gemini Flash 2.0**, and **Google Search Grounding** to identify newly viral products, emerging dupes, brand responses, acquisition signals, price gaps, and mass-market copycat behavior.
- Built a structured database schema to track products, scan runs, findings, and market-response signals over time, enabling trend analysis across categories without hardcoding brands or competitors.
- Created product-facing dashboards for monitoring viral product and dupe activity, ranking products by price differential, tracking weekly intelligence reports, and identifying mass-market response patterns.

## Product Analyst Lens

The platform turns scattered market signals into structured intelligence for pricing strategy, competitive positioning, assortment planning, and trend forecasting. It demonstrates market research automation, data-backed product strategy, AI-assisted analysis, full-stack analytics tooling, and consumer trend intelligence.

## Setup

1. Clone repo
2. `npm install`
3. Create account at turso.tech
4. `turso db create dupe-economy`
5. `turso db tokens create dupe-economy`
6. Add to `.env.local`:

```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
GEMINI_API_KEY=your-key
```

7. `npm run dev`
8. Schema initializes and seeds on first request to `/api/products`
9. Test scan:

```bash
curl -X POST http://localhost:3000/api/scan
```

## Vercel

Add all three env vars in the Vercel dashboard. Turso works natively with Vercel serverless. No other changes needed.

## Local Fallback

If Turso env vars are not present, the app uses a local `file:dupe-economy.db` database for development.

