# ModelRate Documentation Index

This directory is the documentation hub for product planning, engineering decisions, launch operations and production data quality.

## Reading Order

For a new maintainer, read in this order:

1. [Market Research Report](modelrate-market-research.md)
2. [Architecture Overview](architecture.md)
3. [Development Guide](development.md)
4. [Data Governance](data-governance.md)
5. [Launch Hardening Plan](launch-hardening-plan.md)
6. [Deployment Checklist](deployment-checklist.md)
7. [Production Runbook](production-runbook.md)

## Product and Market

- [Market Research Report](modelrate-market-research.md)
  - Chinese market research for the ModelRate idea.
  - Covers competitors, target users, product positioning, monetization, MVP scope, SEO and risks.
  - Use this when deciding what ModelRate should become.

## Engineering

- [Architecture Overview](architecture.md)
  - Current app architecture and boundaries.
  - Explains public pages, admin dashboard, API routes, Prisma, Supabase Auth, fixtures and observability.
  - Use this before changing shared app structure, auth, data access or deployment assumptions.

- [Development Guide](development.md)
  - Local setup, scripts, quality gate and development workflow.
  - Use this when running the project locally or preparing a change for review.

- [Data Governance](data-governance.md)
  - Pricing source policy, manual estimates, current-price semantics and public data rules.
  - Use this before editing seed data, production model prices, relay prices or public disclosures.

## Launch and Operations

- [Launch Hardening Plan](launch-hardening-plan.md)
  - P0/P1/P2 launch scope, risks and implementation history.
  - Use this to understand what still blocks public launch and what belongs post-launch.

- [Deployment Checklist](deployment-checklist.md)
  - Checklist for required services, environment variables, auth setup, data policy and launch gates.
  - Use this as the production readiness checklist.

- [Production Runbook](production-runbook.md)
  - Step-by-step production operation guide for Supabase, Vercel, Sentry, Analytics, DNS, smoke tests and rollback.
  - Use this during actual production deployment or rollback.

## Operational Commands

Core quality:

```bash
npm run quality
npm run build
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

Production data validation:

```bash
npm run ops:validate-launch-data
npm run ops:validate-launch-data:strict
```

Production HTTP smoke:

```bash
npm run ops:smoke-production -- https://your-production-domain.example
```

Database operations:

```bash
npm run db:validate
npm run db:migrate:deploy
npm run db:seed
```

## Documentation Rules

- Keep the root `README.md` short; link to detailed docs instead of duplicating them.
- Keep product research and Chinese market context in Chinese when it is user-facing or planning-focused.
- Keep engineering and operations docs in English for maintainability.
- Update [Data Governance](data-governance.md) whenever public price semantics or source labels change.
- Update [Production Runbook](production-runbook.md) whenever deployment steps, environment variables or smoke checks change.
