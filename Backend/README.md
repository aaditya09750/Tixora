# Tixora API

NestJS + TypeScript + Prisma + PostgreSQL. See the root [`README.md`](../README.md) for the project overview and full quick start.

## Local development

```bash
pnpm install
cp .env.example .env       # fill DATABASE_URL and a real JWT_SECRET
pnpm seed                  # idempotent: admin + sales + 25 tickets
pnpm dev                   # http://localhost:4000
```

## Scripts

- `pnpm dev` — tsx watch with auto-reload
- `pnpm build` — prisma generate && tsc to `dist/`
- `pnpm start` — run the compiled server
- `pnpm lint` / `pnpm lint:fix`
- `pnpm typecheck`
- `pnpm seed`

## Layout

```
src/
├─ config/         env (Zod-validated)
├─ auth/           authentication controllers, guards, decorators
├─ dashboard/      dashboard logic and metrics endpoints
├─ tickets/        support ticket controllers and services
├─ team/           team metrics and assignee endpoints
├─ prisma/         prisma service injection
├─ lib/            periods module, filters, etc.
├─ types/          custom type definitions
├─ app.module.ts   app module configuration
├─ main.ts         entry point
└─ seed.ts         idempotent seed script
```

See [`docs/API.md`](../docs/API.md) for the endpoint catalogue.
