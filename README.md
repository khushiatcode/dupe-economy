# Dupe Economy

Open intelligence for tracking and analyzing the dupe pipeline across fashion, makeup, skincare, and haircare.

## Setup

1. Clone repo
2. `npm install`
3. Create account at turso.tech (free)
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

## Local fallback

If Turso env vars are not present, the app uses a local `file:dupe-economy.db` database for development.

