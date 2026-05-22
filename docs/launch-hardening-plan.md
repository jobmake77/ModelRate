# ModelRate Round 1 Launch Hardening Plan

This plan defines the minimum hardening work for Round 1 production launch. The goal is a boring, auditable launch: accurate pricing data, restricted admin writes, explicit commercial disclosure, and no monetization features that can weaken trust before the site has stable content and policy coverage.

## Scope

Round 1 production scope:

- Public model pricing, relay pricing, guide pages, legal pages and calculators.
- Admin-only CRUD for models, model prices, relays, relay prices, guides, submissions and ad placements.
- Supabase PostgreSQL and Auth as the production data/auth boundary.
- Vercel as the runtime for public pages, admin pages and API routes.

Out of scope for Round 1:

- Google AdSense enablement.
- Automated price sync jobs that can overwrite manually reviewed production data.
- Public account features.
- Public write APIs beyond submissions and outbound click tracking.

## Priority Definitions

- P0: Must be complete before first public production launch. A P0 miss can leak privileged access, corrupt data, create legal/commercial disclosure risk or make rollback difficult.
- P1: Should be complete before broader distribution. A P1 miss does not block a controlled launch, but it increases operational or trust risk.
- P2: Post-launch hardening or growth work. A P2 miss is acceptable for Round 1 if it is tracked.

## P0 Launch Blockers

### P0.1 Production Environment Boundary

Required state:

- Vercel production and preview environments use separate environment variable sets.
- Supabase production project is separate from any local or preview database.
- `DATABASE_URL` uses the Supabase pooled connection string.
- `DIRECT_URL` uses the Supabase direct connection string and is reserved for Prisma migrations/administrative operations.
- `NEXT_PUBLIC_SITE_URL` points to the final production origin.
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client and is only present as a server-side Vercel variable if a route genuinely needs it.
- `CLICK_HASH_SALT` is a production-only random secret and is not the local fallback.
- `CRON_SECRET` is set even if cron routes are not enabled yet, so future cron endpoints do not launch with an empty secret.

Verification:

- Inspect Vercel production and preview variables before deployment.
- Confirm no secret values are committed in docs, code or Vercel build logs.
- Run `npm run build` with production-like variables before launch.

### P0.2 Migration and Seed Discipline

Required state:

- Prisma schema validates before any production DB operation.
- Production schema changes are applied through migrations, not ad hoc table edits.
- Seed runs once after migrations and after `ADMIN_EMAILS` is final.
- Seeded admin owner emails match Supabase Auth users.
- Seeded model prices, relay prices, guides, legal pages references and ad placements are reviewed before public traffic.

Required order:

1. Configure Supabase production project.
2. Configure Vercel production variables.
3. Validate Prisma schema with `npm run db:validate`.
4. Apply production migrations with `DIRECT_URL`.
5. Generate client if needed with `npm run db:generate`.
6. Run seed once with production variables using `npm run db:seed`.
7. Verify seeded rows through the admin dashboard and read-only public pages.

Verification:

- `admin_users` contains at least one `owner` with `status = active`.
- Public pages do not expose draft/hidden/archived records.
- Ad placements are present but disabled.
- Prices have source URL and checked-at metadata where required.

### P0.3 Auth and RBAC

Required state:

- `/admin` and `/api/admin/*` require a valid Supabase session.
- Authorization checks must use both Supabase Auth identity and the `admin_users` table.
- A Supabase Auth user without an active `admin_users` record must not access admin pages or admin APIs.
- `owner`, `admin`, `editor` and `viewer` remain explicit roles in `admin_users`.
- Dangerous admin actions are limited by role:
  - `owner` and `admin`: commercial settings, ad placements, submission review and high-impact write operations.
  - `editor`: content and data edits only where the API explicitly allows it.
  - `viewer`: read-only admin access only.
- Production must not rely on the non-production fallback admin session.

Verification:

- Login with the owner account and confirm admin pages load.
- Attempt admin access without login and confirm rejection.
- Attempt admin access with a Supabase user that is not in `admin_users` and confirm rejection.
- Review admin API routes for role checks before enabling non-owner accounts.

### P0.4 Public Write Hardening

Public write surfaces in Round 1:

- `POST /api/submissions`
- `POST /api/outbound-clicks`

Required state:

- Both endpoints validate payloads with strict schemas.
- Both endpoints return generic error messages and do not expose stack traces or internal database details.
- `POST /api/submissions` caps text fields, keeps all submissions in `pending`, and requires admin review before any public data changes.
- `POST /api/outbound-clicks` only records relay clicks when the URL matches the published relay website or referral URL.
- IP addresses are never stored in plain text; only salted hashes may be stored.
- Production `CLICK_HASH_SALT` is set before launch.
- Add operational protection at the Vercel/edge layer if abuse appears before app-level rate limiting exists.

Verification:

- Submit malformed payloads and confirm 400 responses.
- Submit oversized fields and confirm validation rejection.
- Submit a relay outbound click with a mismatched URL and confirm rejection.
- Confirm click rows do not include plain IP addresses.

### P0.5 Commercial Disclosure and Trust Surface

Required state:

- Sponsored, referral and verified labels are visible on relay lists and relay detail pages.
- Commercial disclosure remains visible in `/disclaimer`, `/privacy` and relevant relay UI.
- Relay ranking or positioning must not imply that sponsored/referral entries are editorially superior unless there is an explicit, auditable ranking rule.
- Pricing pages show source and last checked metadata.
- Legal pages `/privacy`, `/terms` and `/disclaimer` are reachable from the public site.
- The public site must not hide affiliate/referral relationships behind generic outbound links.

Verification:

- Review `/relays` and `/relays/[slug]` for sponsored/referral labels.
- Review `/disclaimer` for affiliate, sponsored and pricing accuracy language.
- Review `/privacy` for analytics, click tracking and future advertising language.
- Confirm public price pages show source and last checked information.

### P0.6 AdSense Deferred

Required state:

- Ad placement records may exist, but all production placements remain disabled.
- No live Google AdSense script is shipped in Round 1.
- No UI copy implies ads are active before policy review.
- AdSense is treated as a post-launch P2 item after content quality, policy pages and disclosure language stabilize.

Verification:

- Confirm admin ad placement rows have `isEnabled = false`.
- Confirm production HTML does not include live AdSense script tags.
- Confirm deployment checklist keeps AdSense as blocked until post-launch review.

### P0.7 Rollback and Data Recovery

Required state:

- Previous Vercel deployment is retained for instant rollback.
- Production database backup/export is taken before risky data changes.
- Bad public records are hidden or superseded instead of deleted where audit history matters.
- Manual data changes are logged through admin workflows where possible.

Verification:

- Identify the previous known-good Vercel deployment before launch.
- Confirm Supabase backup/export access.
- Confirm hidden/draft statuses work for relays, models and guides.

## P1 Pre-Distribution Work

- Maintain `/admin/users` as the owner-only place for application authorization. Supabase Auth account creation is not sufficient for admin access until the same email is active in `admin_users`.
- Keep at least one `active` owner at all times. Do not downgrade or disable the final active owner.
- Review the admin dashboard data quality cards before launch:
  - stale model prices older than 30 days
  - very stale model prices older than 90 days
  - missing model price sources
  - missing relay price sources
  - missing relay price checked-at metadata
  - published relays with unknown risk
  - published relays without public pricing
  - old pending submissions
- Treat one public model price as the primary current price. If multiple current prices exist for a model, public pages use source priority before recency: official, manual, openrouter, litellm, portkey, relay.
- Derive relay supported providers from current relay model prices in database mode. Do not rely on fixture-only `supportedProviders` when validating production filters.
- Add app-level rate limiting or abuse throttling for public write endpoints.
- Add Sentry or equivalent error monitoring before submitting the site to broader traffic sources.
- Vercel Analytics is wired as the V1 analytics provider; verify production page views after deployment and keep privacy language aligned.
- Keep canonical metadata, JSON-LD, sitemap and security headers in the launch smoke checklist.
- Add smoke checks for admin auth, public calculators, sitemap and robots.
- Add a production data review checklist for model prices, relay prices and guide freshness.
- Review role-specific permissions for every `/api/admin/*` route before inviting non-owner staff.
- Add an operational runbook for correcting bad prices, hiding unsafe relays and responding to abuse.

## Round 2 Operational Readiness

Round 2 moves the project from secure MVP toward an operator-friendly preview.

Required state:

- `/admin/users` exists and is restricted to `owner`.
- `owner` can create app-level admin authorization records and update role/status metadata.
- API-level guard prevents disabling or downgrading the last active owner.
- Admin dashboard exposes data quality cards and links back to the relevant admin sections.
- Relay provider filtering works from database relations, not only seed fixtures.
- Model price current selection is deterministic and auditable.
- Unit tests cover admin user owner guard and current price source priority.

Verification:

- Visit `/admin/users` in local bootstrap mode and confirm the development owner appears.
- Try to disable the final owner through the API and confirm a 409 response.
- Visit `/admin` and confirm the Data Quality section is visible.
- Confirm `/relays?provider=OpenAI` still filters relays correctly.
- Run `npm run quality` before continuing to SEO/observability work.

## Round 3 SEO and Observability Baseline

Round 3 adds the public launch metadata and lightweight observability foundation without changing product scope.

Required state:

- Shared SEO helpers generate canonical, OpenGraph and Twitter metadata from `NEXT_PUBLIC_SITE_URL`.
- Public core pages emit JSON-LD:
  - `WebSite` and `Organization` at the root
  - `WebApplication` for calculators
  - `ItemList` for models, relays and guides
  - `SoftwareApplication` for model detail pages
  - `Organization` for relay detail pages
  - `Article` and `BreadcrumbList` for guide detail pages
- Sitemap static entries do not use a moving `new Date()` timestamp.
- Robots blocks admin and admin API routes.
- Baseline security headers are configured in `next.config.ts`.
- Vercel Analytics is included in the root layout.
- Sentry remains pending until production DSN and release/source-map handling are configured.

Verification:

- Run `npm run quality`.
- Run `npm run build`.
- Run `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`.
- Confirm E2E checks canonical metadata, JSON-LD presence and security headers.

## P2 Post-Launch Work

- Evaluate AdSense only after the site has stable original content, legal pages, disclosure language and clean navigation.
- Add automated price sync with review gates and audit logging before any production overwrite path.
- Add email notifications for new submissions and high-risk admin actions.
- Add admin audit trail for changes to prices, relays, guides and ad placements.
- Add separate preview seed data or a staging database to avoid preview traffic touching production data.
- Add scheduled link checks for source URLs, relay websites and referral links.

## Launch Decision Gate

Round 1 can launch only when all P0 items are complete and verified. P1 items can be waived for a controlled launch if the waiver has an owner and a follow-up date. P2 items must not block Round 1, but AdSense must remain explicitly deferred until its P2 review is complete.
