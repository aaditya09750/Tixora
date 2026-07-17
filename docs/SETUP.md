<!-- markdownlint-disable MD013 MD033 -->

# Tixora Setup & Deployment Guide

This guide provides step-by-step instructions for running the Tixora CRM system on your local machine and deploying it to production hosting services (Neon DB, Render, and Vercel).

---

## 1. Local Development Setup

### System Prerequisites

Ensure your local machine has the following tools installed and active:

- **Node.js**: Version `22.x` or higher (validated via [`.nvmrc`](file:///c:/SharedData/Downloads/Tixora/.nvmrc)).
  ```bash
  node -v # Should yield >= v22.0.0
  ```
- **pnpm**: Pinned to version `10.30.0` or higher.
  ```bash
  corepack enable && corepack prepare pnpm@latest --activate
  pnpm -v # Should yield >= 10.30.0
  ```
- **PostgreSQL Database**: A local PostgreSQL service running on port `5432` or a remote serverless instance on Neon DB.
- **Docker Desktop**: (Optional) For containerized deployments.

---

### Option A: Local Workspace Run (No Docker)

#### Step 1: Install Workspace Dependencies

From the repository root directory, run:

```bash
pnpm install
```

_Note: A single unified `pnpm-lock.yaml` handles dependencies for both directories. Avoid running `pnpm install` separately inside the packages._

#### Step 2: Configure Environment Files

1. Create your Backend environment configurations:
   ```bash
   cp Backend/.env.example Backend/.env
   ```
2. Edit `Backend/.env` and update the database URL and JWT parameters:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tixoradb?schema=public"
   JWT_SECRET="generate-a-strong-random-key-with-at-least-32-characters"
   JWT_EXPIRES_IN="7d"
   ```
3. Create your Frontend configurations:
   ```bash
   cp Frontend/.env.example Frontend/.env
   ```
4. Set the backend endpoint URL in `Frontend/.env`:
   ```env
   VITE_API_URL="http://localhost:4000/api"
   ```

#### Step 3: Run Database Schema Migrations

Deploy the database tables and relational schemas directly to your PostgreSQL instance:

```bash
pnpm --filter ./Backend build
npx prisma db push --schema=Backend/prisma/schema.prisma
```

#### Step 4: Seed Mock Data

Inject default login credentials, mock tickets, activities feed, contacts, and dashboard aggregates into the database:

```bash
pnpm --filter ./Backend seed
```

#### Step 5: Boot Dev Servers

Start the backend and frontend services concurrently:

```bash
# Terminal tab 1: Starts NestJS on http://localhost:4000
pnpm --filter ./Backend dev

# Terminal tab 2: Starts Vite on http://localhost:3000
pnpm --filter ./Frontend dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Option B: Containerized Orchestration (Docker Compose)

Run the full container stack (Nginx frontend, Node backend, PostgreSQL database) in a single run:

#### Step 1: Copy Root Env File

```bash
cp .env.example .env
```

_Edit the `.env` file at the root to supply a strong `JWT_SECRET` value (minimum 32 characters)._

#### Step 2: Start Containers

```bash
docker compose up --build
```

_The API service waits for the PostgreSQL database container health check to pass before booting._

#### Step 3: Seed Database (One-time)

Run the seeder inside the backend container to populate default tables:

```bash
docker compose exec api node dist/seed.js
```

URLs:

- **Frontend Web Access**: <http://localhost:8080>
- **Backend Health Check**: <http://localhost:4000/api/health>

---

## 2. Seed Login Profiles Reference

Log in using these seeded test profiles:

| Role      | Email Address              | Password      | Functionality Scope                                                         |
| --------- | -------------------------- | ------------- | --------------------------------------------------------------------------- |
| **Admin** | `admin@tixora.local`       | `admin123!`   | Full database views, unrestricted queue, Team summaries, and agent filters. |
| **Agent** | `sales@tixora.local`       | `sales123!`   | Accesses only their owned queue. No Team page access.                       |
| **Agent** | `aadigunjal0975@gmail.com` | `aaditya123!` | Accesses only their owned queue. No Team page access.                       |

---

## 3. Provisioning Production Hosting

### 3.1. Database Setup (Neon DB)

1. Register a free account at **[Neon Tech](https://neon.tech)** and create a new project.
2. Select your closest server region.
3. Once the database server launches, copy the connection string. It will look like:
   ```text
   postgresql://alex:password@ep-cool-cloud-123456.us-east-2.aws.neon.tech/tixoradb?sslmode=require
   ```
4. Save this string to use as the `DATABASE_URL` environment variable.

---

### 3.2. API Deployment (Render Container Service)

Tixora ships with a pre-configured [`render.yaml`](../render.yaml) Blueprint to deploy the NestJS API container.

1. Connect your GitHub repository to your Render account.
2. Click **New** → **Blueprint** on Render.
3. Select your repository. Render parses `render.yaml` and initializes the `tixora-api` Docker service.
4. Set the sync values in the Render settings dashboard:
   - `DATABASE_URL`: Paste the Neon DB PostgreSQL connection string.
   - `CORS_ORIGIN`: Set to your production Vercel application URL (e.g. `https://tixora-orcin.vercel.app`).
   - _Note: Render auto-generates a secure `JWT_SECRET` key._
5. Run the database seed from Render's **Shell** tab:
   ```bash
   pnpm seed
   ```

---

### 3.3. Web Deployment (Vercel Frontend)

1. Sign in to your Vercel Dashboard, click **Add New** → **Project**, and import the repository.
2. Under project settings, specify `Frontend` as the **Root Directory**.
3. Supply the following Environment Variable:
   - `VITE_API_URL`: Your production Render service path (e.g. `https://tixora-api-z8kk.onrender.com/api`).
4. Click **Deploy**. Vercel reads [`Frontend/vercel.json`](../Frontend/vercel.json) to handle Single Page Application path rewrites.
5. Update Render's `CORS_ORIGIN` env variable with your assigned Vercel URL, then redeploy the backend service.

---

### Smoke Test Testing Commands

Verify your production endpoints from your terminal:

```bash
# 1. Health check probe
curl -s https://tixora-api-z8kk.onrender.com/api/health

# 2. Login verification
TOKEN=$(curl -s -X POST https://tixora-api-z8kk.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tixora.local","password":"admin123!"}' \
  | jq -r '.data.token')

# 3. Access verification (List Tickets)
curl -s -H "Authorization: Bearer $TOKEN" \
  https://tixora-api-z8kk.onrender.com/api/tickets | jq '.meta'
```

---

## 4. Troubleshooting References

### 4.1. `Invalid environment configuration: [ JWT_SECRET ]`

The NestJS application fails to boot, indicating the `JWT_SECRET` key is missing or shorter than 32 characters.

- **Resolution**: Generate a compliant secret key by running:
  ```bash
  openssl rand -base64 48
  ```
  Paste the resulting key in your `.env` configuration file.

### 4.2. CORS Errors in the Browser Console

Request calls fail due to cross-origin resource block checks.

- **Resolution**: Make sure the backend `CORS_ORIGIN` variable matches your client application origin.
  - Local Dev: `CORS_ORIGIN=http://localhost:3000`
  - Production: Set the Render dashboard value to your exact Vercel URL (e.g. `https://tixora-orcin.vercel.app`, no trailing slash). If you need multiple origins (like preview branch deploys), supply them as a comma-separated list.

### 4.3. Husky Pre-Commit Hooks Fail to Execute

Husky scripts do not trigger when attempting to commit.

- **Resolution**: Reinstall node dependencies from the repository root:
  ```bash
  pnpm install
  ```
  This triggers the prepare script which maps the git hooks directory to `.husky/_`.

### 4.4. Conventional Commits Rejection

Git blocks commit submissions.

- **Resolution**: The project enforces the Conventional Commits structure. Ensure your commit subject headers match the specification format:
  ```text
  feat(tickets): add status change validations
  fix(auth): correct token decode expiry check
  chore: bump standard dependencies versions
  ```

### 4.5. `Prisma Client not found` or `tsc` Typecheck Failures

TypeScript type checks fail with errors inside controller files indicating database properties are missing.

- **Resolution**: On clean checkouts, run the Prisma generation script once before compiling or type-checking:
  ```bash
  pnpm --filter ./Backend prisma:generate
  ```
  This creates the database client mapping libraries inside the local `node_modules` folders.
