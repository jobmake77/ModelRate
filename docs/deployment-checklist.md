# ModelRate Deployment Checklist

This checklist keeps the first production launch boring: one Next.js full-stack app on Vercel, Supabase Postgres/Auth, and manual data operations through the admin dashboard. Use it together with `docs/launch-hardening-plan.md` and `docs/production-runbook.md`.

## Launch Priority Gate

- P0 items block the first public production launch.
- P1 items should be complete before broader distribution, but can be waived for a controlled launch with an owner and follow-up date.
- P2 items are post-launch hardening/growth work and must stay tracked.
- AdSense is P2 and must remain disabled for Round 1.

## Production Architecture

- Vercel hosts the Next.js app, public pages, admin pages, API routes and future cron routes.
- Supabase provides PostgreSQL and Auth.
- Cloudflare owns DNS for the production domain.
- Sentry is wired into the app and optional for the first preview, but should be configured before public launch.
- Vercel Analytics is wired into the app as the V1 analytics provider. Do not enable AdSense until content and policy pages are stable.

## P0 Required Services

- Create one Supabase production project.
- Create one Vercel project connected to this repository.
- Add the production domain in Vercel.
- Point DNS through Cloudflare after the Vercel domain is verified.
- Create at least one Supabase Auth user for the owner/admin email.

## P0 Required Environment Variables

Set these in Vercel production and preview environments. Production and preview should use separate values unless the variable is intentionally public and environment-neutral.

Database:

```text
DATABASE_URL
DIRECT_URL
```

Site:

```text
NEXT_PUBLIC_SITE_URL
```

Supabase Auth:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Admin and operational secrets:

```text
ADMIN_EMAILS
CRON_SECRET
CLICK_HASH_SALT
```

Optional variables:

```text
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
SENTRY_TRACES_SAMPLE_RATE
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
OPENROUTER_API_KEY
EXCHANGE_RATE_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_ANALYTICS_DOMAIN
```

Environment rules:

- `DATABASE_URL` must use the Supabase pooled connection string.
- `DIRECT_URL` must use the Supabase direct connection string for Prisma migrations and administrative operations.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client code or public logs.
- `CLICK_HASH_SALT` must be a production-only random secret. Do not rely on the local fallback.
- `NEXT_PUBLIC_SITE_URL` must match the canonical production origin before sitemap, robots and auth redirect checks.
- Vercel Analytics does not require a project env var, but privacy copy must continue to disclose analytics and click tracking behavior.
- `SENTRY_DSN` enables server/edge error reporting. `NEXT_PUBLIC_SENTRY_DSN` enables client-side reporting.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are needed only when uploading source maps during production builds.
- Keep `SENTRY_TRACES_SAMPLE_RATE` and `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` low until production traffic is understood.

## P0 Database Setup

1. Copy the Supabase pooled connection string into `DATABASE_URL`.
2. Copy the Supabase direct connection string into `DIRECT_URL`.
3. Confirm `ADMIN_EMAILS` contains the owner email before seeding.
4. Run Prisma validation:

```bash
npm run db:validate
```

5. Apply migrations with the production direct URL when migrations are introduced.
6. Generate Prisma client if the deploy path does not already do it:

```bash
npm run db:generate
```

7. Run seed once after migrations and after confirming `ADMIN_EMAILS`:

```bash
npm run db:seed
```

Current seed data includes providers, models, current model prices, exchange rates, relay stations, relay model prices, ad placements, guides and admin users.

Post-seed checks:

- `admin_users` contains at least one `owner` with `status = active`.
- Seeded owner emails match real Supabase Auth users.
- Ad placement rows exist but remain disabled.
- Public model and relay prices have source and last checked metadata where required.

## P0 Admin Auth and RBAC Setup

- Add the owner email to `ADMIN_EMAILS`.
- Create the same user in Supabase Auth.
- Run seed so `admin_users` contains the owner record.
- Confirm `/admin` works only after Supabase login in production.
- Keep owner/admin/editor/viewer roles in `admin_users`; do not rely only on Supabase Auth email existence.
- Confirm a Supabase Auth user without an active `admin_users` record cannot access `/admin` or `/api/admin/*`.
- Confirm production does not use the non-production fallback admin session.
- Use `/admin/users` for application-level authorization after the first owner is seeded.
- Keep at least one active owner. The app API blocks disabling or downgrading the final active owner, but this should also be checked before manual database edits.
- Review role restrictions before adding non-owner users:
  - owner/admin: commercial settings, ad placements, submission review and high-impact writes.
  - editor: content and pricing/data edits only where explicitly allowed.
  - viewer: read-only admin access only.

## P1 Admin Data Quality Checks

Review the `/admin` Data Quality section before launch:

- `Stale model prices` should be 0 or explicitly accepted for preview.
- `Very stale prices` must be 0 for public launch.
- `Missing model sources` must be 0 for public launch.
- `Missing relay sources` and `Missing relay checks` should be resolved before promoting relay pricing.
- `Unknown relay risk` should be resolved before a relay is considered recommended.
- `No public pricing` should be expected only for relays that are clearly marked as unclear/manual-review.
- `Old submissions` should be triaged before launch.

Current model price policy:

- Public pages use one primary current price per model.
- Source priority is `official`, `manual`, `openrouter`, `litellm`, `portkey`, `relay`.
- Recency is only a tie-breaker inside the same source priority.
- Admin creation of a current model price archives previous current prices for the same model.

## P0 Pre-Deploy Verification

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

## P0 Launch Checks

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
- Production HTML does not include live Google AdSense script tags.

## P0 Public Write Hardening

Public write endpoints in Round 1:

- `POST /api/submissions`
- `POST /api/outbound-clicks`

Required checks:

- Invalid payloads return 400 without exposing stack traces or database details.
- `POST /api/submissions` stores new submissions as `pending`; public data changes require admin review.
- Submission text fields enforce length limits.
- `POST /api/outbound-clicks` rejects relay clicks whose URL does not match the published relay website or referral URL.
- Plain IP addresses are not stored; click tracking stores only salted hashes.
- `CLICK_HASH_SALT` is set in production before traffic starts.
- If abuse appears before app-level rate limiting exists, add Vercel/edge-level protection.

## P0 Data and Disclosure Policy

- Current model prices must include `sourceUrl` and `lastCheckedAt`.
- Relay prices should include `sourceUrl` and `lastCheckedAt` whenever available.
- Sponsored, referral and verified labels must remain explicit in public lists and detail pages.
- Automatic sync jobs must not overwrite manually verified production prices without review.
- Do not store plain IP addresses; outbound click tracking uses a hash salt.
- `/privacy`, `/terms` and `/disclaimer` must remain reachable from public navigation.
- Commercial disclosure must cover sponsored entries, referral links, pricing accuracy limits and future advertising/analytics where applicable.
- Relay ranking or positioning must not imply paid/referral entries are editorially superior unless the ranking rule is explicit and auditable.

## P0 Rollback Plan

- Keep the previous Vercel deployment available for instant rollback.
- Before risky data changes, export affected Supabase tables.
- Prefer hiding records over deleting public content or pricing data.
- If a bad price is published, hide or replace the current price and keep source metadata for audit.

## P1 Before Broader Distribution

- Configure Sentry DSNs and source-map upload env vars.
- Confirm Vercel Analytics is receiving production page views after privacy language is reviewed.
- Add app-level rate limiting or abuse throttling for public write endpoints.
- Add production smoke checks for admin auth, calculators, sitemap, robots and legal pages.
- Review every `/api/admin/*` route before inviting non-owner admins.
- Create an operational runbook for price corrections, unsafe relay hiding and abuse response.

## P1 SEO, Headers and Observability

- Public pages use canonical metadata derived from `NEXT_PUBLIC_SITE_URL`.
- Root metadata includes OpenGraph and Twitter defaults.
- Home, calculators, model list, relay list, model detail, relay detail and guide detail pages emit JSON-LD.
- `sitemap.xml` excludes admin/API/private content and avoids volatile `lastModified` values for static pages.
- `robots.txt` blocks `/admin` and `/api/admin`.
- App responses include baseline security headers:
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - restrictive `Permissions-Policy`
- Vercel Analytics is enabled in the root layout.
- Sentry is wired for server, edge, client, request and global React errors. Production reporting starts only after DSNs are configured.

Sentry production check:

1. Create a Sentry Next.js project.
2. Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
3. Add `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` if source maps should be uploaded during Vercel builds.
4. Deploy a Vercel preview.
5. Trigger a controlled test error and confirm it appears in Sentry with the correct environment and release.
6. Confirm no sensitive request payloads or admin secrets are present in captured events.

## P2 Post-Launch

- Evaluate AdSense only after stable original content, policy pages, disclosure language and navigation are reviewed.
- Add automated price sync only with review gates, audit logging and no silent overwrite of manually verified production prices.
- Add admin audit trail for price, relay, guide and ad placement changes.
- Add email notifications for new submissions and high-risk admin actions.
- Add scheduled link checks for source URLs, relay websites and referral links.
