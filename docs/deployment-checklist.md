# ModelRate Deployment Checklist

This checklist keeps the first production launch boring: one Next.js full-stack app on Vercel, Supabase Postgres/Auth, and manual data operations through the admin dashboard.

## Production Architecture

- Vercel hosts the Next.js app, public pages, admin pages, API routes and future cron routes.
- Supabase provides PostgreSQL and Auth.
- Cloudflare owns DNS for the production domain.
- Sentry is optional for the first preview, but should be configured before public launch.
- Analytics can be Plausible, Umami or Vercel Analytics. Do not enable AdSense until content and policy pages are stable.

## Required Services

- Create one Supabase production project.
- Create one Vercel project connected to this repository.
- Add the production domain in Vercel.
- Point DNS through Cloudflare after the Vercel domain is verified.
- Create at least one Supabase Auth user for the owner/admin email.

## Required Environment Variables

Set these in Vercel production and preview environments:

```text
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
CRON_SECRET
CLICK_HASH_SALT
```

Optional variables:

```text
SENTRY_DSN
OPENROUTER_API_KEY
EXCHANGE_RATE_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_ANALYTICS_DOMAIN
```

## Database Setup

1. Copy the Supabase pooled connection string into `DATABASE_URL`.
2. Copy the Supabase direct connection string into `DIRECT_URL`.
3. Run Prisma validation:

```bash
npm run db:validate
```

4. Apply migrations with the production direct URL when migrations are introduced.
5. Run seed once after confirming `ADMIN_EMAILS`:

```bash
npm run db:seed
```

Current seed data includes providers, models, current model prices, exchange rates, relay stations, relay model prices, ad placements, guides and admin users.

## Admin Auth Setup

- Add the owner email to `ADMIN_EMAILS`.
- Create the same user in Supabase Auth.
- Run seed so `admin_users` contains the owner record.
- Confirm `/admin` works only after Supabase login in production.
- Keep owner/admin/editor/viewer roles in `admin_users`; do not rely only on Supabase Auth email existence.

## Pre-Deploy Verification

Run locally before creating a production deployment:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run db:validate
npm run test
npm run build
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

The Playwright command expects a local app to be available at `http://localhost:3000`.

## Launch Checks

- `/models` displays current prices with source and last checked metadata.
- `/tools/token-cost-calculator` returns USD and CNY estimates.
- `/tools/model-rate-calculator` returns One-API multiplier output.
- `/relays` and `/relays/[slug]` show risk, referral/sponsored labels and last checked metadata.
- `/guides` and guide detail pages render seeded articles.
- `/privacy`, `/terms` and `/disclaimer` are reachable.
- `/robots.txt` blocks `/admin`.
- `/sitemap.xml` includes public pages only.
- `/admin` is noindexed.
- Admin model, price, relay, relay price, guide, submission and ad placement pages load for authorized admins.
- Ad placements remain disabled until policy review is complete.

## Data Policy

- Current model prices must include `sourceUrl` and `lastCheckedAt`.
- Relay prices should include `sourceUrl` and `lastCheckedAt` whenever available.
- Sponsored, referral and verified labels must remain explicit in public lists and detail pages.
- Automatic sync jobs must not overwrite manually verified production prices without review.
- Do not store plain IP addresses; outbound click tracking uses a hash salt.

## Rollback Plan

- Keep the previous Vercel deployment available for instant rollback.
- Before risky data changes, export affected Supabase tables.
- Prefer hiding records over deleting public content or pricing data.
- If a bad price is published, hide or replace the current price and keep source metadata for audit.
