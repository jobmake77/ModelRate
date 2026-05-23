# ModelRate

ModelRate is an AI API cost transparency site for model pricing, token-cost calculation, One-API / New API multiplier calculation, relay station comparison and launch-ready content operations.

The project is a single Next.js full-stack app:

- Public website and calculators
- `/admin` management dashboard
- API routes
- Prisma data model
- Supabase PostgreSQL/Auth production boundary
- Vercel deployment target

## Quick Start

```bash
npm install
npm run dev
```

Local URL:

```text
http://localhost:3000
```

Admin URL:

```text
http://localhost:3000/admin
```

Without `DATABASE_URL`, local development uses fixture/bootstrap data.

## Quality Gate

Run before committing or deployment:

```bash
npm run quality
npm run build
```

Run browser E2E when UI, routing, auth or launch behavior changes:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

## Documentation

Start here:

- [Documentation Index](docs/README.md)
- [Architecture Overview](docs/architecture.md)
- [Development Guide](docs/development.md)
- [Data Governance](docs/data-governance.md)
- [Market Research Report](docs/modelrate-market-research.md)
- [Launch Hardening Plan](docs/launch-hardening-plan.md)
- [Deployment Checklist](docs/deployment-checklist.md)
- [Production Runbook](docs/production-runbook.md)
