<!-- markdownlint-disable MD013 MD033 -->

# Tixora API Specification

This document details the REST API specifications, query filters, authorization rules, request/response bodies, and integration examples for the Tixora CRM system.

## Global Configurations & Conventions

### Base Endpoint Paths

- **Development (Local Host)**: `http://localhost:4000/api`
- **Nginx Development Proxy**: `http://localhost:8080/api`
- **Production Deployment**: `https://tixora-api-z8kk.onrender.com/api`

### Content Type Headers

All request bodies and responses are encoded in **JSON** (`application/json`).

### Authorization Header

Protected paths require standard Bearer token values matching the format:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```

### Global Client Scope Override

The API accommodates both standard CLI integration clients and the official Web dashboard SPA. The web UI passes a custom tracking header:

```http
x-tixora-client: web
```

When this header is active, returned models are enclosed in standard JSON envelope containers `{ data: ... }`. Paginated listing endpoints append a metadata block `{ data: [...], meta: { total, page, limit, totalPages } }`.

### Standard API Error Envelopes

If a request fails, the application returns a matching HTTP failure code along with a descriptive JSON object:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": ["customer_email must be a valid email"]
  }
}
```

#### Supported Error Reference Codes:

- `BAD_REQUEST` (400): General syntax structure formatting issues.
- `UNAUTHORIZED` (401): Missing, expired, or invalid authorization headers.
- `FORBIDDEN` (403): User role has insufficient permissions.
- `NOT_FOUND` (404): Resource not found.
- `CONFLICT` (409): Resource constraint violation (e.g. duplicate email registration).
- `VALIDATION_ERROR` (422): Input parameters or JSON body fields failed check requirements.
- `RATE_LIMITED` (429): Rate limits exceeded.
- `INTERNAL` (500): Server runtime errors.

---

## Endpoint Summary Index

| HTTP Verb  | Path                                                  | Authorization  | Purpose                                                         |
| ---------- | ----------------------------------------------------- | -------------- | --------------------------------------------------------------- |
| **`GET`**  | [`/health`](#1-get-apihealth)                         | Public         | Server liveness and database readiness probe                    |
| **`POST`** | [`/auth/register`](#2-post-apiauthregister)           | Public         | Registers a new agent user profile (default `role=sales`)       |
| **`POST`** | [`/auth/login`](#3-post-apiauthlogin)                 | Public         | Authenticates credentials and issues a JWT token                |
| **`GET`**  | [`/auth/me`](#4-get-apiauthme)                        | Bearer         | Returns active agent user details                               |
| **`GET`**  | [`/tickets`](#5-get-apitickets)                       | Bearer         | Lists and searches ticket records (optional pagination)         |
| **`POST`** | [`/tickets`](#6-post-apitickets)                      | Bearer         | Creates a new support ticket in the database                    |
| **`GET`**  | [`/tickets/:ticket_id`](#7-get-apiticketsticket_id)   | Bearer         | Retrieves a detailed ticket record and internal comment history |
| **`PUT`**  | [`/tickets/:ticket_id`](#8-put-apiticketsticket_id)   | Bearer         | Updates a ticket status or appends an internal note             |
| **`GET`**  | [`/team`](#9-get-apiteam)                             | Bearer + Admin | Fetches summary statistics across the sales agents team         |
| **`GET`**  | [`/dashboard/overview`](#10-get-apidashboardoverview) | Bearer         | Retrieves dashboard KPI metrics and chart arrays                |
| **`GET`**  | [`/activities`](#11-get-apiactivities)                | Bearer         | Retrieves the 20 most recent system events                      |
| **`GET`**  | [`/contacts`](#12-get-apicontacts)                    | Bearer         | Fetches alphabetical list of support contacts                   |
| **`GET`**  | [`/notifications`](#13-get-apinotifications)          | Bearer         | Resolves notifications matching current user's role             |

---

## Endpoint Details

### 1. `GET /api/health`

Database-aware server readiness check. Used by hosting orchestrators (like Render) to verify container status.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/health
```

#### Response (200 OK - DB Connected)

```json
{
  "status": "ok",
  "service": "tixora-api",
  "uptime": 124.52,
  "db": "connected"
}
```

#### Response (503 Service Unavailable - DB Disconnected)

```json
{
  "status": "degraded",
  "service": "tixora-api",
  "uptime": 3.12,
  "db": "disconnected"
}
```

---

### 2. `POST /api/auth/register`

Creates a new user profile. Rate-limited to a maximum of 20 requests per 15 minutes per IP.

#### Request Payload

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@tixora.local",
  "password": "strongPassword123!",
  "role": "sales"
}
```

- `role` must be either `"admin"` or `"sales"` (defaults to `"sales"` if omitted).

#### Sample Request

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane.doe@tixora.local","password":"strongPassword123!","role":"sales"}'
```

#### Response (201 Created)

```json
{
  "data": {
    "user": {
      "id": "c62fb529-659f-4318-80f0-8c29b1395fd1",
      "name": "Jane Doe",
      "email": "jane.doe@tixora.local",
      "role": "sales",
      "created_at": "2026-07-17T20:00:00.000Z",
      "updated_at": "2026-07-17T20:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Common Error Responses

- `409 CONFLICT` if email is already registered:
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "Email is already registered"
    }
  }
  ```
- `422 UNPROCESSABLE ENTITY` if validation checks fail:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Input validation failed",
      "details": ["password must be longer than or equal to 8 characters"]
    }
  }
  ```

---

### 3. `POST /api/auth/login`

Authenticates credentials and returns a Bearer JWT. Rate-limited to 20 requests per 15 minutes per IP.

#### Request Payload

```json
{
  "email": "sales@tixora.local",
  "password": "sales123!"
}
```

#### Sample Request

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@tixora.local","password":"sales123!"}'
```

#### Response (200 OK)

```json
{
  "data": {
    "user": {
      "id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
      "name": "Sales User",
      "email": "sales@tixora.local",
      "role": "sales",
      "created_at": "2026-07-17T18:00:00.000Z",
      "updated_at": "2026-07-17T18:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Common Error Responses

- `401 UNAUTHORIZED` for incorrect credentials:
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid email or password"
    }
  }
  ```

---

### 4. `GET /api/auth/me`

Resolves the user details of the active JWT token owner.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)

```json
{
  "data": {
    "user": {
      "id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
      "name": "Sales User",
      "email": "sales@tixora.local",
      "role": "sales",
      "created_at": "2026-07-17T18:00:00.000Z",
      "updated_at": "2026-07-17T18:00:00.000Z"
    }
  }
}
```

---

### 5. `GET /api/tickets`

Lists and filters support tickets.

- **Scope Enforcements**: Agents see only their assigned tickets. Admins see all tickets.

#### Query Filter Parameters (Optional)

- `status`: Filter by status (`Open`, `In Progress`, `Closed`).
- `search`: Case-insensitive text search (checks ID, name, email, subject, and description).
- `page`: Integer page index (defaults to `1`).
- `export`: Set to `"true"` to request all records unpaginated for report downloads.

#### Sample Request (Standard Client - Unpaginated)

```bash
curl -X GET "http://localhost:4000/api/tickets?status=Open&search=billing" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK - Standard Client)

```json
[
  {
    "ticket_id": "TIX-1002",
    "customer_name": "Alice Johnson",
    "subject": "Billing issue with invoice #99",
    "status": "Open",
    "created_at": "2026-07-17T19:30:00.000Z"
  }
]
```

#### Sample Request (Web Dashboard Client)

```bash
curl -X GET "http://localhost:4000/api/tickets?status=Open&search=billing&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tixora-client: web"
```

#### Response (200 OK - Web Client)

```json
{
  "data": [
    {
      "id": "848fb629-883f-488b-89ff-2c29b1595fe4",
      "ticket_id": "TIX-1002",
      "customer_name": "Alice Johnson",
      "customer_email": "alice@example.com",
      "subject": "Billing issue with invoice #99",
      "description": "I was charged twice on my credit card.",
      "status": "Open",
      "channel": "Portal",
      "created_by_id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
      "created_at": "2026-07-17T19:30:00.000Z",
      "updated_at": "2026-07-17T19:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 6. `POST /api/tickets`

Submits a new support ticket.

#### Request Payload

```json
{
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com",
  "subject": "API connectivity timeouts",
  "description": "Experiencing connection timeouts when calling the analytics endpoint."
}
```

#### Sample Request

```bash
curl -X POST http://localhost:4000/api/tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"John Doe","customer_email":"john.doe@example.com","subject":"API connectivity timeouts","description":"Experiencing connection timeouts when calling the analytics endpoint."}'
```

#### Response (201 Created - Standard Client)

```json
{
  "ticket_id": "TIX-1003",
  "created_at": "2026-07-17T20:25:00.000Z"
}
```

#### Response (201 Created - Web Client)

```json
{
  "data": {
    "id": "939fb629-993f-488b-99ff-3c29b1595ff9",
    "ticket_id": "TIX-1003",
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "subject": "API connectivity timeouts",
    "description": "Experiencing connection timeouts when calling the analytics endpoint.",
    "status": "Open",
    "channel": "Portal",
    "created_by_id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
    "created_at": "2026-07-17T20:25:00.000Z",
    "updated_at": "2026-07-17T20:25:00.000Z"
  }
}
```

---

### 7. `GET /api/tickets/:ticket_id`

Retrieves a detailed ticket record including its internal notes.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/tickets/TIX-1002 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK - Standard Client)

```json
{
  "ticket_id": "TIX-1002",
  "customer_name": "Alice Johnson",
  "customer_email": "alice@example.com",
  "subject": "Billing issue with invoice #99",
  "description": "I was charged twice on my credit card.",
  "status": "Open",
  "notes": [
    {
      "id": "e22fb529-659f-4318-80f0-8c29b1395fe3",
      "ticket_id": "TIX-1002",
      "note_text": "Investigated duplicate charge. Prepared refund transaction.",
      "created_at": "2026-07-17T19:45:00.000Z"
    }
  ]
}
```

#### Response (200 OK - Web Client)

```json
{
  "data": {
    "id": "848fb629-883f-488b-89ff-2c29b1595fe4",
    "ticket_id": "TIX-1002",
    "customer_name": "Alice Johnson",
    "customer_email": "alice@example.com",
    "subject": "Billing issue with invoice #99",
    "description": "I was charged twice on my credit card.",
    "status": "Open",
    "channel": "Portal",
    "created_by_id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
    "created_at": "2026-07-17T19:30:00.000Z",
    "updated_at": "2026-07-17T19:45:00.000Z",
    "notes": [
      {
        "id": "e22fb529-659f-4318-80f0-8c29b1395fe3",
        "ticket_id": "TIX-1002",
        "note_text": "Investigated duplicate charge. Prepared refund transaction.",
        "created_at": "2026-07-17T19:45:00.000Z"
      }
    ]
  }
}
```

---

### 8. `PUT /api/tickets/:ticket_id`

Updates ticket status or appends an internal note.

#### Request Payload

```json
{
  "status": "In Progress",
  "notes": "Refund transaction initiated. Contacting payment gateway."
}
```

- Both fields are optional, but at least one must be provided.

#### Sample Request

```bash
curl -X PUT http://localhost:4000/api/tickets/TIX-1002 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress","notes":"Refund transaction initiated. Contacting payment gateway."}'
```

#### Response (200 OK)

```json
{
  "success": true,
  "updated_at": "2026-07-17T20:10:00.000Z"
}
```

---

### 9. `GET /api/team`

Admin-only endpoint. Returns sales agents listing with ticket counts and queue performance indicators.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/team \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Response (200 OK)

```json
{
  "data": {
    "summary": {
      "totalMembers": 3,
      "adminCount": 1,
      "salesCount": 2,
      "totalTickets": 25,
      "topPerformer": {
        "id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
        "name": "Sales User",
        "email": "sales@tixora.local",
        "totalTickets": 14
      }
    },
    "members": [
      {
        "id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
        "name": "Sales User",
        "email": "sales@tixora.local",
        "role": "sales",
        "avatar": "https://i.pravatar.cc/150?u=sales@tixora.local",
        "ticketCounts": {
          "total": 14,
          "byStatus": {
            "Open": 4,
            "In Progress": 6,
            "Closed": 4
          }
        }
      }
    ]
  }
}
```

---

### 10. `GET /api/dashboard/overview`

Resolves analytic widgets records, location percentages, traffic sources, and monthly volumes.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK - Abridged)

```json
{
  "data": {
    "kpis": [
      {
        "key": "views",
        "title": "Views",
        "value": "721K",
        "change": "+11.01%",
        "positive": true,
        "bgKey": "views"
      },
      {
        "key": "visits",
        "title": "Visits",
        "value": "367K",
        "change": "-0.03%",
        "positive": false,
        "bgKey": "visits"
      }
    ],
    "userChart": {
      "xAxis": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      "series": [
        {
          "name": "Current Week",
          "data": [12, 18, 14, 22, 16, 24, 20],
          "color": "#C6C7F8",
          "dashed": false
        },
        {
          "name": "Previous Week",
          "data": [8, 12, 10, 15, 12, 18, 14],
          "color": "#A8C5DA",
          "dashed": true
        }
      ]
    },
    "trafficByWebsite": [{ "name": "Google", "value": 80, "active": false }],
    "trafficByDevice": [{ "label": "Mobile", "value": 65, "color": "indigo" }],
    "trafficByLocation": [{ "country": "United States", "percentage": 38.6, "color": "purple" }],
    "marketingMonthly": [{ "month": "Jan", "value": 45, "color": "indigo" }]
  }
}
```

---

### 11. `GET /api/activities`

Resolves the 20 most recent system activity event feeds.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/activities \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "454fb629-443f-488b-44ff-2c29b1595fa1",
      "actorName": "Sales User",
      "actorEmail": "sales@tixora.local",
      "actorRole": "sales",
      "action": "Updated status of ticket TIX-1002 to In Progress",
      "created_at": "2026-07-17T20:10:00.000Z"
    }
  ]
}
```

---

### 12. `GET /api/contacts`

Fetches support contacts sorted alphabetically.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "111fb629-111f-488b-11ff-2c29b1595fc1",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "avatar": "https://i.pravatar.cc/150?u=alice",
      "linkedUserRole": null
    },
    {
      "id": "e89fb739-163f-4228-89f0-2c29b1595fc2",
      "name": "Sales User",
      "email": "sales@tixora.local",
      "avatar": "https://i.pravatar.cc/150?u=sales",
      "linkedUserRole": "sales"
    }
  ]
}
```

---

### 13. `GET /api/notifications`

Resolves notifications according to the active token's role.

- **Scope Enforcements**: Admins resolve all. Sales resolve only those tagged as `sales` or `all`.

#### Sample Request

```bash
curl -X GET http://localhost:4000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "999fb629-999f-488b-99ff-2c29b1595fd9",
      "kind": "lead-status",
      "message": "3 support tickets completed this morning.",
      "audience": "all",
      "created_at": "2026-07-17T12:30:00.000Z"
    }
  ]
}
```

- `kind` maps to custom icons and badges (`bug`, `user`, `lead-status`, `subscribe`).
