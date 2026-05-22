# ModelRate Production Runbook

This runbook is the operational path for taking ModelRate from a verified local build to a controlled production launch. It assumes the architecture remains one Next.js app on Vercel with Supabase Postgres/Auth and Cloudflare DNS.

## 1. Preflight

Required local checks before touching production:

```bash
npm run quality
npm run build
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

Preflight owner:

- Confirm the current Git commit is the intended launch commit.
- Confirm there are no uncommitted production changes.
- Confirm `docs/deployment-checklist.md` P0 items are complete.
- Confirm AdSense and paid placement display are still disabled unless explicitly approved.
- Confirm no sample, draft or unreviewed records are intended for public launch.

## 2. Supabase Setup

Create one production Supabase project.

Required configuration:

- Save the pooled database URL as `DATABASE_URL`.
- Save the direct database URL as `DIRECT_URL`.
- Enable Supabase Auth email/password for admin users.
- Create the first owner user in Supabase Auth.
- Keep the owner email in `ADMIN_EMAILS`.

Database bootstrap:

```bash
npm run db:validate
npx prisma migrate deploy
npm run db:seed
```

Post-seed verification:

- `admin_users` has at least one `owner` with `status = active`.
- The owner email matches a real Supabase Auth user.
- Current model prices have `sourceUrl` and `lastCheckedAt`.
- Public relay records have clear risk, referral and sponsored metadata.
- Ad placements exist but are disabled.

## 3. Vercel Setup

Create one Vercel project connected to the GitHub repository.

Set production environment variables:

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
MODELRATE_STRICT_ENV=true
```

Optional but recommended before broader launch:

```text
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
SENTRY_TRACES_SAMPLE_RATE=0.05
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
```

Vercel build command:

```bash
npm run build
```

Vercel deployment checks:

- Preview deployment returns `200` for `/`.
- `/robots.txt` blocks `/admin` and `/api/admin`.
- `/sitemap.xml` contains only public URLs.
- `/admin` redirects to `/admin/login` when logged out.
- Admin owner can log in with Supabase Auth.
- Viewer/editor roles cannot perform unauthorized mutations.

## 4. Sentry Verification

Sentry is wired but inert until DSNs are configured.

Verification steps:

- Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
- Add `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` for source-map upload.
- Deploy a preview.
- Trigger one controlled server or client error in preview.
- Confirm the event appears with the correct environment and release.
- Confirm event payloads do not contain database URLs, service role keys, cron secrets, raw IP addresses or admin credentials.

If source-map upload blocks deployment, remove `SENTRY_AUTH_TOKEN` temporarily. The app still builds and reports errors, but stack traces may be less readable.

## 5. Analytics Verification

Vercel Analytics is enabled through the root layout.

Verification steps:

- Open the Vercel Analytics dashboard after preview deployment.
- Visit `/`, `/models`, `/relays` and both calculators.
- Confirm page views appear.
- Confirm `/privacy` still discloses analytics and hashed click tracking.

## 6. Cloudflare DNS

DNS steps:

- Add the production domain in Vercel.
- Add or update DNS records in Cloudflare according to Vercel instructions.
- Wait for Vercel domain verification.
- Confirm `NEXT_PUBLIC_SITE_URL` exactly matches the production origin.
- Recheck canonical URLs, sitemap URLs and robots sitemap host after DNS settles.

Do not announce the site until the production domain, sitemap and robots all agree on the same host.

## 7. Launch Smoke Test

Run this against the production URL:

- `/` loads and shows the quick calculator.
- `/models` shows model prices with source and last checked.
- `/tools/token-cost-calculator` completes one calculation.
- `/tools/model-rate-calculator` completes one calculation.
- `/relays` shows risk and referral metadata.
- `/guides` and one guide detail page load.
- `/privacy`, `/terms` and `/disclaimer` load from public navigation.
- `/admin` requires login.
- `/admin/users` is owner-only.
- `POST /api/submissions` accepts valid JSON and rate limits repeated requests.
- `POST /api/outbound-clicks` rejects arbitrary external URLs.

## 8. Rollback

Rollback order:

1. If the issue is code-only, roll back to the previous known-good Vercel deployment.
2. If the issue is a bad public record, hide or replace the record in admin instead of deleting it.
3. If a migration caused data issues, stop writes, export affected tables and restore from Supabase backup or manual export.
4. If secrets leaked, rotate the exposed secret first, then redeploy.

Rollback notes:

- Keep the previous Vercel deployment URL before every production launch.
- Export critical Supabase tables before risky data work.
- Prefer `hidden`, `draft` or `archived` status over destructive deletion.
- Do not force-push or rewrite Git history for launch rollback.

## 9. Go / No-Go

Go only if all are true:

- `npm run quality` passes on the launch commit.
- `npm run build` passes on the launch commit.
- Production migration and seed are complete.
- Owner login works.
- Unauthorized admin/API access is blocked.
- Prices show source and last checked.
- Sponsored/referral/verified labels are visible where relevant.
- Privacy, Terms and Disclaimer match actual tracking and commercial behavior.
- Sentry and Analytics are either verified or explicitly waived with an owner.
- There are no known P0/P1 bugs.

No-go examples:

- Calculator results are wrong.
- Admin auth can be bypassed.
- Service role key or database URL appears in a public bundle or response.
- Source/last checked metadata is missing from current prices.
- Referral/sponsored entries look like natural recommendations.
- Production pages return persistent `5xx`.
