# Architecture

How Tixora is wired together. Reading order: system context → request pipeline → primary-workflow sequence → data model → known limitations.

## System context

```mermaid
flowchart LR
  user((User))
  user -->|HTTPS, bearer JWT| web[Frontend<br/>React + Vite, Vercel or nginx]
  web -->|JSON over /api/*| api[Backend<br/>NestJS + TypeScript, Render]
  api -->|Prisma Client| db[(PostgreSQL - Neon DB)]
  api -.->|stdout| logs[(structured logging)]
  api -->|signs / verifies| jwt[[JWT HS256 + JWT_SECRET]]
flowchart
```

Three runtime services in the local Docker compose stack (`web`, `api`, `db`); production splits them across **Vercel** (web), **Render** (api), and **Neon DB** (db). Frontend talks to backend only through `/api/*` — in production via the configured `VITE_API_URL`.

## Request pipeline (API)

```mermaid
flowchart TB
  req([Incoming request])
  req --> cors[CORS middleware<br/>env.CORS_ORIGIN comma-split]
  cors --> auth[AuthGuard<br/>JWT verify → req.user]
  auth --> role[AdminRoute check<br/>optional admin layer]
  role --> controller[Controller DTO Validation<br/>class-validator / DTOs]
  controller --> svc[Service — business logic]
  svc --> db[(Prisma Client / PostgreSQL)]
  svc --> controller
  controller --> res([JSON envelope])
  controller -.->|throws NestJS HttpException| err[HttpExceptionFilter<br/>exception filter]
  err --> res
flowchart
```

Mounting order is handled via NestJS's standard execution pipeline: Guards → Interceptors → Pipes (Validation) → Route Handlers → Exception Filters.

Errors bubble up to the global `HttpExceptionFilter` which maps errors to a structured `{ error: { code, message, details? } }` envelope.

## Primary workflow — Agent creates and filters tickets

```mermaid
sequenceDiagram
  autonumber
  actor S as Agent / Sales user
  participant UI as React + Zustand
  participant AX as axios + JWT interceptor
  participant API as NestJS Controller
  participant SVC as TicketsService
  participant DB as PostgreSQL

  S->>UI: Submit register or login form
  UI->>AX: POST /auth/register | /auth/login
  AX->>API: HTTP + JSON body
  API->>SVC: register / login (bcrypt + jwtService)
  SVC->>DB: User findUnique / create
  DB-->>SVC: record
  SVC-->>API: { user, token }
  API-->>UI: 201 / 200 envelope
  UI->>UI: authStore.setSession(token, user)<br/>persist token to localStorage

  S->>UI: Open /tickets, type "billing" in search
  Note over UI: useDebounce(value, 400ms)
  UI->>AX: GET /tickets?search=billing&status=Open&page=1
  AX->>API: Authorization: Bearer <jwt>
  API->>API: AuthGuard (decode → req.user)
  API->>SVC: findAll(query)
  SVC->>DB: prisma.ticket.count + prisma.ticket.findMany (skip/take)
  DB-->>SVC: records + total count
  SVC-->>API: { data, meta }
  API-->>UI: 200 envelope
  UI->>UI: React Query / state stores update

  S->>UI: Click Export CSV (Admins only)
  UI->>AX: GET /tickets/export
  AX->>API: Authorization: Bearer <jwt>
  API->>SVC: findAll (unpaginated)
  SVC->>DB: prisma.ticket.findMany
  DB-->>SVC: array
  SVC-->>API: AsyncParser.parse(rows) → csv string
  API-->>UI: text/csv response
  UI->>UI: download as file
```

Every authenticated request shares the same guard validation: `AuthGuard` first, then route handlers. Role-based ownership checks live in the service layer for tickets (agents only see/touch their own; admins see all).

## Admin workflow — Team page + per-user drill-in

```mermaid
sequenceDiagram
  autonumber
  actor A as Admin
  participant UI as React
  participant API as NestJS Controller
  participant SVC as TeamService
  participant DB as PostgreSQL

  A->>UI: Navigate to /team
  UI->>API: GET /team (bearer)
  API->>API: AuthGuard → admin role check
  API->>SVC: getOverview()
  SVC->>DB: User.findMany
  SVC->>DB: Ticket.findMany
  DB-->>SVC: users + tickets
  SVC->>SVC: Compute ticket counts per member
  SVC-->>API: { summary, members }
  API-->>UI: 200 envelope
  UI->>UI: Render KPI tiles + members table

  A->>UI: Click "View tickets" on a member row
  UI->>UI: navigate(`/tickets?owner=${email}`)
  UI->>API: GET /tickets?search=<email>&page=1
  API->>SVC: findAll with filters
  SVC->>DB: ticket.findMany with customer_email or related filters
  DB-->>API: records
  API-->>UI: filtered list
```

## Dashboard read-API workflow

The dashboard KPIs, time-series charts, website traffic breakdown, and monthly volume are fully computed dynamically at runtime from database queries on `Ticket`, `User`, `Note`, and `Activity`.

```mermaid
sequenceDiagram
  participant UI as Dashboard widgets
  participant API as NestJS Controller
  participant SVC as DashboardService
  participant DB as PostgreSQL

  UI->>API: GET /dashboard/overview?period=month (bearer)
  API->>API: AuthGuard
  API->>SVC: getOverview(userId, userRole, periodKey)
  SVC->>DB: Ticket.findMany (current & previous ranges)
  SVC->>DB: User.findMany
  DB-->>SVC: records
  SVC->>SVC: Bin tickets into time-series axis buckets<br/>Aggregate counts by channel, status, and agent
  SVC-->>API: { period, kpis, userChart, trafficByWebsite, trafficByDevice, trafficByLocation, marketingMonthly }
  API-->>UI: 200 response
```

---

## Data model

The database schema is defined in [schema.prisma](Backend/prisma/schema.prisma) and maps the following core tables:

```mermaid
erDiagram
  USER ||--o{ TICKET : "createdBy"
  USER ||--o{ ACTIVITY : "actor"
  USER ||--o| CONTACT : "linkedUser (optional)"
  TICKET ||--o{ NOTE : "notes"

  USER {
    String id PK
    String name
    String email "unique"
    String passwordHash
    String role "admin | sales"
    DateTime createdAt
    DateTime updatedAt
  }

  TICKET {
    String id PK
    Int id_seq "unique autoincrement"
    String ticket_id "unique sequential ID"
    String customer_name
    String customer_email
    String subject
    String description
    String status "Open | In Progress | Closed"
    String created_by_id FK "ref: User"
    DateTime createdAt
    DateTime updatedAt
  }

  NOTE {
    String id PK
    String ticket_id FK "ref: Ticket"
    String note_text
    DateTime created_at
  }

  ACTIVITY {
    String id PK
    String actor_id FK "ref: User"
    String action
    DateTime created_at
  }

  CONTACT {
    String id PK
    String name
    String email "optional"
    String avatar "optional"
    String linked_user_id FK "ref: User, optional"
  }

  NOTIFICATION {
    String id PK
    String kind
    String message
    String audience
    DateTime created_at
  }
```

---

## Known limitations & considerations

- **Type drift** between Backend and Frontend interfaces. Mitigated by CI lint+typecheck on both sides. pnpm workspaces are in place (see [ADR 0006](docs/ADRs/0006-pnpm-workspaces.md)).
- **Token in localStorage** is XSS-exposed. CSP and httpOnly-cookie migration are in the roadmap.
- **No refresh tokens**. The access token simply expires after `JWT_EXPIRES_IN`; the user re-logs in.
- **CSV export is array-based** (`Ticket.findMany()`). Bounded by available heap.
- **In-memory rate limiter**. Multi-dyno deployments need a shared store (`rate-limit-redis`).
- **No observability** (Sentry/OTel). Logs are stdout only.
