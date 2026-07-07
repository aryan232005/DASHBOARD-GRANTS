# SmalBlu — Global Grant Intelligence Dashboard

SmalBlu tracks grant funding opportunities worldwide and manages your application
pipeline, with a built-in Gemini-powered assistant for matching and drafting help.

## Tech stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers (`app/api/*`) — deploy as Vercel serverless functions
- **Database:** PostgreSQL via Prisma (optional — falls back to in-memory demo data)
- **Cache:** Redis via ioredis (optional — falls back to in-memory cache)
- **AI:** Google Gemini (`@google/generative-ai`), called only from the server
- **Scheduled jobs:** Vercel Cron (`vercel.json`) instead of `node-cron`, since Vercel
  functions are stateless and don't support long-running timers
- **Email (optional):** SendGrid for deadline alerts
- **File storage (optional):** AWS S3

## Running locally

```bash
npm install
cp .env.example .env.local
# paste your GEMINI_API_KEY into .env.local
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL` set, the app runs fully in
**demo mode** using the sample grants in `lib/grants-data.ts` — nothing to configure
to try it out.

## Adding your Gemini key

Your key is **never sent to the browser**. It's read only inside:
- `lib/gemini.ts` (server-only module)
- called from `app/api/gemini/route.ts` (a server route handler)

To add it:
1. Local dev: put `GEMINI_API_KEY=your-key-here` in `.env.local` (already gitignored).
2. Production (Vercel): Project → Settings → Environment Variables → add
   `GEMINI_API_KEY`. Redeploy.

## Enabling the real database (optional, recommended before real users)

1. Create a free Postgres instance (Neon, Supabase, or Vercel Postgres all work).
2. Set `DATABASE_URL` in `.env.local` / Vercel env vars.
3. Run:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed grants by POSTing to `/api/grants`, or write a `prisma/seed.ts` from
   `lib/grants-data.ts`.

## Enabling Redis (optional)

Add `REDIS_URL` (Upstash Redis has a free tier and works natively on Vercel).
Without it, an in-memory cache fallback is used automatically.

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Then in the Vercel dashboard add the environment variables from `.env.example`
(at minimum `GEMINI_API_KEY` and `JWT_SECRET`). The `vercel.json` file already
configures a daily cron hitting `/api/cron/deadline-check` at 08:00 UTC.

## Project structure

```
app/
  page.tsx              → Dashboard home
  grants/page.tsx        → Global grant explorer + Gemini ranking
  applied/page.tsx        → Application pipeline tracker
  api/
    grants/route.ts       → GET/POST grants
    applied/route.ts       → GET/POST applications
    gemini/route.ts        → Gemini chat + ranking (key stays server-side)
    auth/login/route.ts     → JWT session login
    cron/deadline-check/route.ts → Vercel Cron target
components/
  Navbar.tsx, GrantCard.tsx, StatsBar.tsx, GeminiAssistant.tsx
lib/
  db.ts, gemini.ts, cache.ts, auth.ts, grants-data.ts
prisma/schema.prisma     → Postgres schema (User, Grant, AppliedGrant)
```

## Security notes

- All secrets (`GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`,
  `SENDGRID_API_KEY`, AWS keys) are read only in server-side files (`app/api/*`,
  `lib/*`) and are **not** prefixed with `NEXT_PUBLIC_`, so Next.js never bundles
  them into client JavaScript.
- `.env` / `.env.local` are gitignored — never commit real keys.
- The `/api/cron/deadline-check` route checks a `CRON_SECRET` bearer token so
  it can't be triggered by random requests once you set one.
