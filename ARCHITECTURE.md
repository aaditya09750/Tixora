# Tixora System Architecture & Design

This document details the system design, request execution pipelines, workflow sequences, database models, and architectural decisions governing the **Tixora Customer Support CRM**.

---

## 1. System Context

Tixora is built using a monorepo workspace containing a NestJS backend API, a React 19 frontend single-page application (SPA), and a PostgreSQL database.

```mermaid
flowchart TB
  subgraph Client [Client Tier]
    user((Support Agent / Admin))
    web[Frontend SPA<br/>React 19 + Vite 6<br/>Hosted on Vercel / Nginx]
  end

  subgraph Service [API Tier]
    api[Backend API Service<br/>NestJS 11 + Express<br/>Hosted on Render]
    jwt[[JWT Service<br/>HS256 Authorization]]
    pino[(Pino Logger<br/>Stdout / Redacted)]
  end

  subgraph Data [Data Tier]
    db[(Database Service<br/>PostgreSQL - Neon DB)]
  end

  user -->|HTTPS, JWT| web
  web -->|JSON REST Calls /api/*| api
  api -->|Prisma Client| db
  api -.->|Redacted Logs| pino
  api -.->|Sign & Verify Claims| jwt
```

In a local environment, the services are run either directly via workspaces tooling (`pnpm dev`) or orchestrated inside Docker Compose (`web`, `api`, `db`). In production, they are distributed across Vercel (frontend), Render (backend container runtime), and Neon DB (serverless managed PostgreSQL).

---

## 2. API Request Lifecycle

Every incoming HTTP request to the NestJS API passes through a strict execution pipeline before returning a standardized JSON envelope.

```mermaid
flowchart TD
  req([Incoming HTTP Request]) --> cors[CORS Middleware<br/>Origin verification]
  cors --> helmet[Helmet Middleware<br/>Security headers]
  helmet --> comp[Compression Middleware<br/>Gzip compression]
  comp --> auth[AuthGuard<br/>JWT decryption & claim mapping]
  auth --> role[AdminGuard / Roles check<br/>Optional RBAC validation]
  role --> pipes[ValidationPipe<br/>class-validator DTO sanitization]
  pipes --> controller[Controller Layer<br/>Route mapping & query parsing]
  controller --> svc[Service Layer<br/>Core business logic]
  svc --> db[(Prisma Client / PostgreSQL)]
  db --> svc
  svc --> controller
  controller --> res([Standard JSON Envelope<br/>{ data, meta? }])

  %% Error Boundary Handling
  controller -.->|Throws HttpException| filter[HttpExceptionFilter<br/>Global Exception Mapper]
  svc -.->|Throws AppExceptions| filter
  pipes -.->|Validation Failed| filter
  filter --> errRes([Standard Error Envelope<br/>{ error }])
```

### Request Pipeline Components:

1. **Middlewares**: CORS rules, Helmet security headers, and gzip compression are mounted globally in [`main.ts`](file:///c:/SharedData/Downloads/Tixora/Backend/src/main.ts).
2. **AuthGuard**: Extracts the `Authorization` header, decrypts the Bearer JWT token using `JwtService`, validates the expiration, and populates `req.user` with the agent's identity.
3. **Roles Check**: Enforces role constraints (`admin` or `sales`) on restricted routes (like `/api/team`).
4. **ValidationPipe**: Automatically validates and sanitizes incoming body payloads and query parameters using DTO definitions.
5. **HttpExceptionFilter**: Intercepts all bubbled errors and maps them to a unified format:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Input validation failed",
       "details": ["customer_email must be a valid email"]
     }
   }
   ```

---

## 3. Core Workflow Sequences

### 3.1. Agent Authentication and Ticket Creation

This diagram details the flow from initial agent login to creating a new ticket with automatic sequential ID assignment (`TIX-XXXX`).

```mermaid
sequenceDiagram
  autonumber
  actor Agent as Support Agent
  participant SPA as React SPA (Zustand)
  participant Client as Axios Client
  participant API as NestJS API Controller
  participant SVC as TicketsService
  participant DB as PostgreSQL (Neon DB)

  Agent->>SPA: Submit credentials on /login
  SPA->>Client: POST /auth/login { email, password }
  Client->>API: Send login payload
  API->>DB: Find user by email and verify bcrypt passwordHash
  DB-->>API: User record (role: "sales")
  API->>API: Generate 7-day HS256 JWT token
  API-->>Client: Returns 200 { data: { user, token } }
  Client-->>SPA: Update authStore & save JWT to localStorage

  Agent->>SPA: Submit new ticket form
  SPA->>Client: POST /api/tickets { customer_name, customer_email, subject, description }
  Client->>API: Request with Authorization: Bearer <jwt>
  API->>API: AuthGuard decrypts JWT -> populates req.user
  API->>SVC: createTicket(dto, req.user.id)
  Note over SVC: Auto-increment sequence seq_id handles sequential ticket_id: "TIX-" + (1000 + seq_id)
  SVC->>DB: Prisma transaction: insert Ticket & log Activity
  DB-->>SVC: Ticket details (id_seq = 4)
  SVC-->>API: Return ticket details with generated ticket_id ("TIX-1004")
  API-->>Client: Returns 201 { data: Ticket }
  Client-->>SPA: Refresh tickets list & trigger toast alert
```

---

### 3.2. Admin Overview and Member Ticket Drill-Down

Admins have visibility over all agents' performance metrics and can inspect any individual queue.

```mermaid
sequenceDiagram
  autonumber
  actor Admin as Administrator
  participant SPA as React SPA
  participant API as NestJS API Controller
  participant SVC as TeamService
  participant DB as PostgreSQL (Neon DB)

  Admin->>SPA: Navigate to /team
  SPA->>API: GET /api/team
  API->>API: AuthGuard validates token & checks admin role
  API->>SVC: getTeamOverview()
  SVC->>DB: Query User list & group ticket totals by created_by_id and status
  DB-->>SVC: Raw members and ticket count matrices
  SVC->>SVC: Compute summaries & identify top performer
  SVC-->>API: Return summary stats and member arrays
  API-->>SPA: Returns 200 { data: { summary, members } }
  SPA-->>Admin: Render KPI cards and members breakdown table

  Admin->>SPA: Click "View Queue" on agent row (agent@tixora.local)
  SPA->>SPA: Route transition to /tickets?owner=agent@tixora.local
  SPA->>API: GET /api/tickets?owner=agent@tixora.local&page=1
  API->>SVC: findAllTickets(queryFilters)
  SVC->>DB: prisma.ticket.findMany filtered by createdBy.email
  DB-->>SVC: Matched agent ticket list & total counts
  SVC-->>API: Return paginated envelope
  API-->>SPA: Returns 200 { data, meta }
  SPA-->>Admin: Render the agent's scoped support queue
```

---

### 3.3. Dashboard Widgets Read Pipeline

The dashboard reads KPI summaries, time-series charts, and traffic aggregates in a single optimized endpoint.

```mermaid
sequenceDiagram
  autonumber
  actor Agent as Agent / Admin
  participant SPA as Dashboard Widgets
  participant API as NestJS Controller
  participant SVC as DashboardService
  participant DB as PostgreSQL (Neon DB)

  Agent->>SPA: Load /dashboard
  SPA->>API: GET /api/dashboard/overview (Bearer JWT)
  API->>API: AuthGuard maps identity and scopes
  API->>SVC: getOverview(userId, userRole)
  Note over SVC: Parallel retrieval via Promise.all
  SVC->>DB: Query DashboardKpis + ChartSeries + TrafficAggregates
  DB-->>SVC: Raw analytical aggregates
  SVC->>SVC: Format line-charts series & locations percentages
  SVC-->>API: Return combined dashboard data structure
  API-->>SPA: Returns 200 { data }
  SPA-->>Agent: Render ECharts line diagrams, donut charts, and KPI widgets
```

---

## 4. Entity-Relationship Database Layout

Tixora's relational schema is modeled in PostgreSQL using Prisma ORM.

```mermaid
erDiagram
  USER ||--o{ TICKET : "creates (createdBy)"
  USER ||--o{ ACTIVITY : "performs (actor)"
  USER ||--o| CONTACT : "links to (linkedUser)"
  TICKET ||--o{ NOTE : "contains (notes)"

  USER {
    String id PK "UUID"
    String name "Display Name"
    String email UK "Unique Email Address"
    String passwordHash "Bcrypt Encrypted Hash"
    String role "admin | sales"
    DateTime created_at
    DateTime updated_at
  }

  TICKET {
    String id PK "UUID"
    Int id_seq UK "Autoincrement Sequence ID"
    String ticket_id UK "TIX-{1000 + id_seq} format"
    String customer_name
    String customer_email
    String subject
    String description
    String status "Open | In Progress | Closed"
    String channel "Portal | Social Media | Email"
    String created_by_id FK "References User.id"
    DateTime created_at
    DateTime updated_at
  }

  NOTE {
    String id PK "UUID"
    String ticket_id FK "References Ticket.ticket_id"
    String note_text
    DateTime created_at
  }

  ACTIVITY {
    String id PK "UUID"
    String actor_id FK "References User.id"
    String action "Activity Description"
    DateTime created_at
  }

  CONTACT {
    String id PK "UUID"
    String name
    String email "Optional"
    String avatar "Optional Image URL"
    String linked_user_id FK "References User.id (SetNull)"
  }

  NOTIFICATION {
    String id PK "UUID"
    String kind "bug | user | lead-status | subscribe"
    String message
    String audience "admin | sales | all"
    DateTime created_at
  }
```

### Database Design Points:

- **Autoincrement Sequential ID**: `Ticket.id_seq` utilizes PostgreSQL sequence generators to safely yield continuous sequential numeric values.
- **Cascading Deletions**: Deleting a `User` cascades to delete associated `Ticket` and `Activity` records. Deleting a `Ticket` cascades to wipe its associated internal `Note` records.
- **Nullable User Links**: Deleting a `User` does not delete a `Contact` card; the connection is safely set to null (`onDelete: SetNull`).

---

## 5. Architectural Considerations and Trade-offs

### 5.1. Monorepo Organization

We maintain a monorepo structure managed through `pnpm` workspaces (detailed in [ADR 0006](docs/ADRs/0006-pnpm-workspaces.md)). This architecture allows shared type structures, simplified repository management, and synchronized build steps under one central `pnpm-lock.yaml`.

### 5.2. Client-Side JWT Storage

Authentications are logged using Bearer JWT tokens stored in `localStorage` on the client (detailed in [ADR 0005](docs/ADRs/0005-token-in-localstorage.md)). While highly compatible with static hosting architectures (like Vercel), it introduces XSS vulnerability risks. Moving to an `httpOnly` secure cookie structure remains a primary roadmap objective.

### 5.3. Relational Autoincrement sequence formats

Generating ticket numbers using a custom Postgres sequence (`TIX-${1000 + id_seq}`) guarantees that ticket IDs are short, guessable, and user-friendly. A transactional schema ensures no ID sequence skips occur during high-concurrency ticket submissions.

### 5.4. In-Memory Rate Limiting

NestJS routes rate-limit limits are calculated in-memory on the application runtime instance. While simple and sufficient for standalone container deploys, it requires migrating to Redis-backed limiters when deploying multiple horizontal backend instances.
