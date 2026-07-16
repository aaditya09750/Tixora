# Setup guide

End-to-end walkthrough for getting Tixora running locally and deployed to production.

- [Local development](#local-development) — clone-to-running in ~5 minutes.
- [PostgreSQL Database](#postgresql-database) — managed database (free tier).
- [Production deploy](#production-deploy) — Backend → Render, Frontend → Vercel.
- [Troubleshooting](#troubleshooting) — common errors and fixes.

## Local development

### Prerequisites

- Node.js 22+ (`nvm install 22 && nvm use 22`).
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`).
- A PostgreSQL instance: local `postgresql` on port `5432`, or a cloud instance.
- (Optional) Docker Desktop / Docker Compose for the bundled stack.

### Option A — Two terminals (no Docker)

```bash
# Repo root: one install handles both apps (pnpm workspaces, single root lockfile)
pnpm install

# Backend (terminal 1)
cp Backend/.env.example Backend/.env       # fill DATABASE_URL + JWT_SECRET
pnpm --filter ./Backend seed               # idempotent: 3 users + 25 tickets + dashboard data
pnpm --filter ./Backend dev                # http://localhost:4000

# Frontend (terminal 2)
cp Frontend/.env.example Frontend/.env     # VITE_API_URL=http://localhost:4000/api
pnpm --filter ./Frontend dev               # http://localhost:3000
```

### Option B — Docker Compose

```bash
cp .env.example .env                # repo root — set JWT_SECRET
docker compose up --build
```

Three containers start: `db`, `api`, `web`. The api waits for db's healthcheck before booting.

Open <http://localhost:8080> for the UI and <http://localhost:4000/api/health> for the API.

Seed the dockerised database (one-time):

```bash
docker compose exec api node dist/seed.js
```

Stop and wipe data:

```bash
docker compose down -v              # -v removes the postgres_data volume
```

### Seeded credentials

| Role  | Email                      | Password      |
| ----- | -------------------------- | ------------- |
| admin | `admin@tixora.local`       | `admin123!`   |
| sales | `sales@tixora.local`       | `sales123!`   |
| sales | `aadigunjal0975@gmail.com` | `aaditya123!` |

**Rotate these in production.** They exist only to give a fresh-clone reviewer something to log in with.

### JWT signing key

The API enforces a minimum 32-character `JWT_SECRET` via Zod env validation. Generate one with:

```bash
openssl rand -base64 48
```

Paste the output into `Backend/.env` as `JWT_SECRET`. On Render the `render.yaml` Blueprint auto-generates this on first deploy (`generateValue: true`).

## PostgreSQL Database

The fastest path to a managed PostgreSQL for cloud deploys is Neon DB's free tier.

1. **Sign up / sign in** at <https://neon.tech> and create a project.
2. **Create a database** — pick the free tier in your nearest region. Provisioning takes ~30 seconds.
3. **Get the connection string** — copy the PostgreSQL URI. It looks like:

   ```text
   postgresql://<user>:<pass>@<cluster>.neon.tech/tixoradb?sslmode=require
   ```

   Paste it into `Backend/.env` as `DATABASE_URL`. Make sure the database name (`tixoradb`) is in the path.

4. **Verify** locally: `cd Backend && pnpm seed`. You should see database seeding complete and dashboard seed complete.

## Production deploy

Production splits across three vendors:

- **Backend → Render** via the Blueprint at [`render.yaml`](../render.yaml).
- **Frontend → Vercel** via [`Frontend/vercel.json`](../Frontend/vercel.json).
- **Database → Neon DB** (free tier is sufficient for review).

### 1. Backend — Render Blueprint

1. Push to GitHub.
2. Render dashboard → **New → Blueprint → connect this repo**. Render auto-detects `render.yaml` and provisions the `tixora-api` service.
3. In the dashboard, fill the two `sync: false` env vars:
   - `DATABASE_URL` — Neon DB connection string from above.
   - `CORS_ORIGIN` — your Vercel URL (placeholder OK for first deploy; update after step 2).
4. Render auto-generates `JWT_SECRET` (`generateValue: true`). Rotate it later by deleting the variable in the dashboard and redeploying.
5. **One-time seed** — Render dashboard → Shell tab → `pnpm seed`. This creates users + tickets + dashboard data.
6. **Sanity check** — `https://<your-service>.onrender.com/api/health` should return `{ "status": "ok", "db": "connected" }`.

### 2. Frontend — Vercel

1. Vercel dashboard → **New Project → Import this repo**. Set **Root directory** to `Frontend` (Vercel auto-detects Vite via `vercel.json`).
2. **Environment variables**: `VITE_API_URL = https://<your-render-service>.onrender.com/api`.
3. **Deploy**. The SPA rewrite in `vercel.json` makes hard-refreshes on `/tickets` or `/team` work correctly.

### 3. Wire the two together

Once Vercel assigns a production URL (e.g. `https://tixora.vercel.app`):

1. Return to Render → Environment → update `CORS_ORIGIN` to the Vercel URL (no trailing slash). For multiple origins (preview URLs), use a comma-separated list.
2. **Manual Deploy** in Render to pick up the change.

### Post-deploy smoke

```bash
# Health
curl https://<render-service>.onrender.com/api/health

# Login as admin
TOKEN=$(curl -s -X POST https://<render-service>.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tixora.local","password":"admin123!"}' \
  | jq -r '.data.token')

# Verify the tickets endpoint
curl -s -H "Authorization: Bearer $TOKEN" \
  https://<render-service>.onrender.com/api/tickets | jq '.meta'

# Verify the admin team endpoint
curl -s -H "Authorization: Bearer $TOKEN" \
  https://<render-service>.onrender.com/api/team | jq '.data.summary'
```

Then open the Vercel URL in a browser, log in, and confirm the dashboard renders + tickets filter + CSV exports.

### Deployment notes

- **Render free tier sleeps after 15 minutes of inactivity.** First request after sleep takes ~30 s while the dyno wakes; subsequent calls are instant. The paid tier removes this.
- **`BCRYPT_ROUNDS=12`** is set in `render.yaml` (vs `10` locally). Each login takes ~250 ms on Render's free tier; tune down if needed.
- **Vercel preview deployments** have unique URLs per branch — they won't pass CORS unless you add their pattern to `CORS_ORIGIN`. For pure production deploys, this is fine.

## Troubleshooting

### Connection hangs or database error

- Neon DB → Project Settings → IP Allowlist is blocking your connection. Allow dynamic dev IPs.
- Wrong user/password in the URI. Re-copy from Neon DB. URL-encode special chars (`@`, `:`, `/`).
- Wrong DB name. The URI must end with `/<dbname>` (e.g. `/tixoradb`) before parameters.

### `Invalid environment configuration: [ JWT_SECRET ]`

`JWT_SECRET` is missing or shorter than 32 chars. Generate a longer one: `openssl rand -base64 48`.

### `Activity references unknown actorEmail "..."` during `pnpm seed`

The dashboard seed references a user that doesn't exist. After the recent seed refactor this should not happen on a fresh database. If you see it on a re-run, drop `tixoradb` and re-seed.

### CORS error in the browser console

The API's `CORS_ORIGIN` allowlist doesn't include the frontend's origin.

- Local dev: ensure `CORS_ORIGIN=http://localhost:3000` in `Backend/.env`.
- Production: set Render's `CORS_ORIGIN` to your exact Vercel URL (no trailing slash). Multiple origins → comma-separated.

### Husky hooks don't fire on commit

Run the root-level install:

```bash
cd <repo-root>
pnpm install
```

The `prepare` script initialises `.husky/_/`. Verify with `git config --get core.hooksPath` — it should print `.husky/_`.

### `commit-msg` hook rejects "header must not be longer than 100 characters"

Commitlint enforces a 100-char limit on commit-message headers. Shorten the title; details belong in the commit body.

### Pre-push fails on `tsc` errors I can't see locally

Ensure the workspace is fully installed (single root install handles both apps):

```bash
pnpm install
```

The pre-push hook runs `pnpm lint && pnpm typecheck && pnpm build` in each workspace — missing deps will tank the typecheck step. If the hook still fails after a fresh install, blow away the local lockfile state and reinstall:

```bash
rm -rf node_modules Frontend/node_modules Backend/node_modules
pnpm install
```

### Vercel build fails — `VITE_API_URL is required`

`Frontend/src/lib/env.ts` throws fail-loud on a missing env var. Set `VITE_API_URL` in Vercel → Project Settings → Environment Variables, then redeploy.

### Render deploy succeeds but `/api/health` returns 503

The service is up but Database is unreachable. Check:

1. `DATABASE_URL` is set correctly in Render's env vars (no quoting).
2. Database settings allow the connection.
3. The DB user has access to the named database (`tixoradb`).
