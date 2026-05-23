# ModelRate Architecture Overview

ModelRate is a single Next.js full-stack application. It intentionally avoids a separate backend service in the first launch phase.

## Runtime Shape

```text
Browser
  |
  | Public pages, calculators, admin dashboard
  v
Next.js App Router on Vercel
  |
  | Server components, route handlers, server auth checks
  v
Prisma + Supabase PostgreSQL
  |
  | Admin identity
  v
Supabase Auth
```

## Application Areas

Public website:

```text
app/
  page.tsx
  models/
  relays/
  guides/
  tools/
  about/
  contact/
  privacy/
  terms/
  disclaimer/
```

Admin dashboard:

```text
app/admin/
  page.tsx
  login/
  logout/
  users/
  models/
  model-prices/
  relays/
  relay-prices/
  guides/
  submissions/
  ad-placements/
```

API routes:

```text
app/api/
  calculate/
  models/
  relays/
  guides/
  submissions/
  outbound-clicks/
  admin/
```

Shared modules:

```text
components/
lib/
prisma/
scripts/
tests/
```

## Data Access

Public server components read through `lib/data-access/*` instead of calling the app's own HTTP API.

Important modules:

- `lib/data-access/models.ts`
- `lib/data-access/relays.ts`
- `lib/data-access/guides.ts`
- `lib/data-access/ad-placements.ts`
- `lib/data-access/data-quality.ts`
- `lib/data-access/price-policy.ts`

Rules:

- Public pages use server-side data access.
- Admin API routes perform server-side authorization before mutation.
- Calculators use pure functions from `lib/calculators/`.
- Fixture fallback is allowed only outside strict production mode.

## Database

Prisma schema lives in:

```text
prisma/schema.prisma
```

Core tables:

- `providers`
- `models`
- `model_prices`
- `relay_stations`
- `relay_model_prices`
- `risk_tags`
- `guides`
- `submissions`
- `outbound_clicks`
- `ad_placements`
- `admin_users`
- `exchange_rates`

Migration baseline:

```text
prisma/migrations/20260522000000_init/migration.sql
```

Runtime database usage:

- App runtime uses `DATABASE_URL`.
- Prisma CLI migrations prefer `DIRECT_URL` through `prisma.config.ts`.
- Supabase production should use pooled `DATABASE_URL` and direct `DIRECT_URL`.

## Auth and RBAC

Supabase Auth establishes identity. The application-level authorization source is `admin_users`.

Important files:

- `proxy.ts`
- `lib/auth/admin.ts`
- `app/admin/login/page.tsx`
- `app/admin/logout/route.ts`
- `app/admin/layout.tsx`

Roles:

- `owner`: full access, including admin user management.
- `admin`: manages models, prices, relays, guides, submissions and ad placements.
- `editor`: writes guides; reads model and relay data.
- `viewer`: read-only dashboard access.

Rules:

- `/admin` requires admin session.
- `/api/admin/*` requires admin session.
- Mutating admin routes must call role gates server-side.
- UI hiding is not a security boundary.

## Public Write Hardening

Public write endpoints:

- `POST /api/submissions`
- `POST /api/outbound-clicks`

Hardening:

- JSON `Content-Type` required.
- IP addresses are hashed with `CLICK_HASH_SALT`; raw IPs are not stored.
- Basic in-memory rate limit.
- Submission honeypot field.
- Outbound clicks allow only published relay website/referral exact URLs.

## SEO and Observability

SEO:

- `lib/seo/metadata.ts`
- `lib/seo/json-ld.ts`
- `components/seo/json-ld.tsx`
- `app/sitemap.ts`
- `app/robots.ts`

Observability:

- Vercel Analytics is mounted in `app/layout.tsx`.
- Sentry is wired through:
  - `instrumentation.ts`
  - `instrumentation-client.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `app/global-error.tsx`

Sentry stays inert until DSNs are configured.

## Operational Scripts

Launch data validation:

```text
scripts/validate-launch-data.ts
```

Production HTTP smoke:

```text
scripts/smoke-production.ts
```

These scripts make production readiness checks repeatable instead of relying only on manual review.

## Scope Boundaries

Current launch scope includes:

- Public model pricing and calculators.
- Relay directory and relay price display.
- Guide content.
- Admin CRUD.
- Submission intake and outbound click tracking.
- Production auth, RBAC, migrations, SEO, analytics and Sentry baseline.

Current launch scope excludes:

- Public user accounts.
- API key storage.
- API resale or recharge.
- Automated price sync that overwrites reviewed data.
- Real AdSense activation.
- Public commercial API.
