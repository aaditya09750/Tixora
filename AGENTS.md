# AGENTS.md — agent notes for Tixora

Path-anchored map for AI coding agents working in this repo. Terse. Read once per session.

Compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Aider, and any other agent that
reads root-level `AGENTS.md`. Symlinking `CLAUDE.md → AGENTS.md` (or vice versa) is fine.

## Repo shape

```text
Tixora/
├─ Frontend/             React 19 + Vite 6 + TS + Tailwind 3 (workspace package).
├─ Backend/              NestJS 11 + TS + Prisma 6 + PostgreSQL (workspace package).
├─ docs/                 API.md, SETUP.md, ADRs/
├─ .github/              workflows (CI), templates
├─ .husky/               pre-commit, commit-msg, pre-push
├─ render.yaml           Render Blueprint for the API service (Docker runtime)
├─ pnpm-workspace.yaml   workspace manifest: Frontend + Backend
└─ root                  packageManager pin, dev tooling (husky, commitlint,
                         lint-staged, prettier), pnpm.packageExtensions
                         (injects zod as @hookform/resolvers peer).
```

pnpm workspaces. **One** `pnpm-lock.yaml` at the repo root. `pnpm install` from the root
installs both apps. See [ADR 0006](docs/ADRs/0006-pnpm-workspaces.md) for the why.

## Commands

```bash
# From repo root — one install handles both apps
pnpm install

# Frontend
pnpm --filter ./Frontend dev          # vite, http://localhost:3000
pnpm --filter ./Frontend lint
pnpm --filter ./Frontend typecheck
pnpm --filter ./Frontend build

# Backend
pnpm --filter ./Backend dev           # tsx watch (via tsx watch src/main.ts), http://localhost:4000
pnpm --filter ./Backend seed          # idempotent: 3 users + 25 tickets + dashboard data
pnpm --filter ./Backend lint
pnpm --filter ./Backend typecheck
pnpm --filter ./Backend build
pnpm --filter ./Backend start

# Run a script in every workspace
pnpm -r lint
pnpm -r build

# Docker (from repo root)
docker compose up --build
```

`cd Frontend && pnpm dev` and `cd Backend && pnpm dev` still work — pnpm resolves to the
workspace root regardless of cwd.

## Where things live

| Concern                  | Path                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| API entry                | `Backend/src/main.ts` → `Backend/src/app.module.ts`                                                           |
| API routes (Controllers) | Controllers inside `Backend/src/auth/`, `Backend/src/tickets/`, `Backend/src/dashboard/`, `Backend/src/team/` |
| Prisma Models            | `Backend/prisma/schema.prisma` — User, Ticket, Note, Activity, Contact, Notification                          |
| Business logic           | Services inside `Backend/src/auth/`, `Backend/src/tickets/`, `Backend/src/dashboard/`, `Backend/src/team/`    |
| Error handlers           | `Backend/src/lib/filters/http-exception.filter.ts` (`HttpExceptionFilter` exception mapper)                   |
| Env loader               | `Backend/src/config/env.ts` (Zod-validated, fail-loud on bad config)                                          |
| DB connection / ORM      | `Backend/src/prisma/prisma.service.ts`                                                                        |
| Web entry                | `Frontend/src/main.tsx` → `Frontend/src/App.tsx` (providers + router)                                         |
| Web routes               | `Frontend/src/routes/AppRoutes.tsx` (nests `ProtectedRoute` + `AdminRoute`)                                   |
| Web auth/theme/ui state  | `Frontend/src/store/{authStore,themeStore,uiStore}.ts` (zustand)                                              |
| Web API client           | `Frontend/src/lib/api.ts` (axios + bearer interceptor) + `Frontend/src/api/*`                                 |
| Web types                | `Frontend/src/types/{api,dashboard,team}.ts`                                                                  |
| Design tokens            | `Frontend/tailwind.config.js` + CSS vars in `Frontend/src/index.css`                                          |
| Architecture decisions   | `docs/ADRs/0001..0006-*.md`                                                                                   |
| Deployment IaC           | `render.yaml` (root, Docker runtime) + `Frontend/vercel.json` + `Backend/Dockerfile` (workspace-aware)        |
| Workspace manifest       | `pnpm-workspace.yaml` (root) + single `pnpm-lock.yaml` (root)                                                 |

## Conventions

- **TypeScript strict.** `noUncheckedIndexedAccess: true`. No `any` without an inline justification comment.
- **Validation at HTTP boundaries** via class-validator DTOs or query validation.
- **API response envelope**: `{ data, meta? }` on success; `{ error: { code, message, details? } }` on failure.
- **Pagination meta**: `{ total, page, limit, totalPages }`. `limit` is fixed at 10.
- **Errors** bubble up to the global `HttpExceptionFilter` exception mapper (registered in `app.module.ts`).
- **Auth header**: `Authorization: Bearer <jwt>`. Token in localStorage on the client.
- **RBAC**: Handled in controllers and service logic: sales users see and touch their own queue; admin sees all.
- **Conventional Commits** enforced by `commit-msg` hook (max 100-char header). Hook bypass (`--no-verify`) is not a normal workflow.
- **Pre-push** runs `pnpm lint && pnpm typecheck && pnpm build` on both workspaces. Do not skip.
- **Imports** use relative paths inside each workspace; no `../../../..` chains (split files instead).

## Things to avoid

- Re-introducing any string from `dualite | data-ds | ByeWind | snowui | s3-alpha-sig` — those were scrubbed and their reappearance is a regression.
- Hardcoded URLs. Dynamic config comes from env (`VITE_API_URL` on the web, the `env.ts` loader on the api).
- Adding a feature outside `docs/API.md`'s endpoint list. If it isn't in `docs/API.md`, it doesn't ship — it goes in `README.md`'s Roadmap.
- Creating a `utils.ts` bag. New utilities go in a named module under `lib/`.
- Files over ~300 lines without a split.
- Mixing `fetch` and `axios` on the client; axios is the standard.
- Replacing `bcryptjs` with `bcrypt` — `bcryptjs` is intentional for Docker portability (pure JS, no native binding).
- Bumping `lucide-react` past `^0.4xx` without auditing every icon import (older `^1.16.0` line had a different API).

## Stack quirks

- **Tailwind v3**, not v4. Color tokens are CSS vars driven from `Frontend/src/index.css` `:root` and `:root.dark`; the Tailwind config wires them via `rgb(var(--c-fg) / <alpha-value>)`.
- **Pinned safelist** in `tailwind.config.js` for dynamic class names (`bg-accent-*`, `bg-stat-*`) — extend it before adding a new accent.
- **CSV export is in-memory** (`@json2csv/node` AsyncParser over `Ticket.findMany()`).
- **JWT secret** is enforced ≥ 32 chars by Zod; the server fail-loud-exits on a shorter value.
- **Health check** at `/api/health` returns status of service and database.

## Verification checklist (before claiming "done")

```bash
# Both workspaces must pass (from repo root):
pnpm --filter ./Backend  typecheck && pnpm --filter ./Backend  lint && pnpm --filter ./Backend  build
pnpm --filter ./Frontend typecheck && pnpm --filter ./Frontend lint && pnpm --filter ./Frontend build
```

If you touched the API surface:

```bash
# Manual smoke (with server running + seeded DB):
curl http://localhost:4000/api/health
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tixora.local","password":"admin123!"}' | jq -r '.data.token')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/tickets | jq '.meta'
```

If you touched UI components, manually verify in the browser at desktop (`≥ 1024 px`),
tablet (`768 px`), and mobile (`375 px`) widths. Tables should collapse to cards below `md`.
