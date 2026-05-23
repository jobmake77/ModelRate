# ModelRate Development Guide

This guide covers local development, scripts and change validation.

## Prerequisites

- Node.js compatible with the current Next.js and React versions.
- npm.
- Optional PostgreSQL/Supabase connection for database-backed development.

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

## Environment

Copy from `.env.example` when local database/auth integration is needed.

Core variables:

```text
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
CLICK_HASH_SALT
CRON_SECRET
MODELRATE_STRICT_ENV
```

Local behavior:

- Without `DATABASE_URL`, the app uses fixture data and local admin bootstrap.
- With `DATABASE_URL`, the app uses Prisma/Supabase data.
- `MODELRATE_STRICT_ENV=true` disables fixture fallback and requires production-like env.

## Common Scripts

Development:

```bash
npm run dev
```

Quality:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run db:validate
npm run test
npm run quality
```

Build:

```bash
npm run build
```

E2E:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

Database:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

Operations:

```bash
npm run ops:validate-launch-data
npm run ops:validate-launch-data:strict
npm run ops:smoke-production -- https://your-production-domain.example
```

## Change Workflow

Before changing code:

- Identify whether the change touches public pages, admin, API, data access, Prisma, auth or docs.
- Keep edits scoped to the relevant area.
- Avoid broad refactors during launch hardening.

Before committing:

```bash
npm run quality
npm run build
```

Run E2E when changing:

- Public layout or calculators.
- Admin auth/RBAC.
- API behavior.
- SEO/robots/sitemap.
- Production headers.
- Submission or outbound click behavior.

## Local Admin Mode

If `DATABASE_URL` is not configured, local development uses bootstrap admin behavior. This is for local development only.

Production rules:

- Supabase Auth is required.
- `admin_users` must contain the authenticated admin.
- The user must have `status = active`.
- Server-side RBAC remains the final boundary.

## Fixture Data

Fixture data lives in:

```text
lib/fixtures/
```

Use fixtures for:

- Local development without a database.
- Initial seed data.
- UI smoke and E2E baseline.

Do not treat fixture data as fully verified production data.

## Formatting and Comments

- Code, comments, identifiers and commit messages use English.
- User-facing Chinese copy can remain Chinese.
- Keep comments rare and focused on non-obvious intent.
- Prefer existing local patterns over new abstractions.

## Known Launch-Time Caution

- `manual` model prices are planning estimates unless reviewed.
- Ad placements must remain disabled unless monetization is explicitly approved.
- `SENTRY_AUTH_TOKEN` enables source-map upload during build; omit it temporarily if source-map upload blocks deployment.
- Do not store raw IP addresses.
- Do not let external sync overwrite manually verified production prices.
