<!-- markdownlint-disable MD013 MD033 -->

# Tixora - Smart Customer Support CRM

A modern, fast, and secure support ticket management CRM. Tixora is built with NestJS, Prisma, and PostgreSQL (Neon DB) on the backend, and React 19, TypeScript, Vite, and Tailwind CSS on the frontend. It features role-based access control, real-time ticket activity feeds, status updates, internal notes, search and status filters, and interactive dashboard charts.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#tech-stack)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](#tech-stack)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](#tech-stack)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](#tech-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#tech-stack)

---

## Architecture Overview

Tixora uses a monorepo structure managed via `pnpm` workspaces:

- `/Frontend` — Single-page React 19 application powered by Vite, Zustand, TanStack Query, and ECharts.
- `/Backend` — NestJS framework running Prisma ORM to communicate with PostgreSQL.

---

## Database Schema (PostgreSQL)

The database schema is defined in [schema.prisma](Backend/prisma/schema.prisma) and maps the following core tables:

- **User**: System agents and admins with bcrypt-hashed credentials and roles (`admin` or `sales`).
- **Ticket**: Individual support tickets with unique sequence IDs (`TIX-${1000 + seq}`).
- **Note**: Internal comments/notes attached to tickets.
- **Contact**: Customer contact cards.
- **Activity**: Activity log tracker.
- **Notification**: User-specific notification feed items.

---

## Core Features

### Agents (Sales Users)

- **Ticket Management**: Create support tickets with fields for Customer Name, Email, Subject, and Description.
- **Update Status**: Move tickets through `Open` → `In Progress` → `Closed`.
- **Internal Comments**: Compose and append notes/comments to tickets for team updates.
- **Filter and Search**: Perform full-text search across IDs, titles, descriptions, and emails, and filter tickets by status or assignee.
- **Dashboard**: Track ticket KPIs, channel distribution, and monthly volume via beautiful, interactive charts.

### Admins

- **Full Scoped Access**: Search, view, and update any ticket in the system without assignment constraints.
- **Team Page**: View real-time agent lists, review performance metrics (Total Tickets, Open, In Progress, Closed), and drill down to inspect any individual agent's queue.

---

## REST API Endpoints

### 1. Authentication

- `POST /api/auth/register` - Create a new agent profile.
- `POST /api/auth/login` - Authenticate and retrieve a 7-day bearer JWT.

### 2. Tickets

- `GET /api/tickets` - List and filter tickets (supports query parameters: `status`, `search`, `owner`, `sort`, `page`).
- `GET /api/tickets/:ticketId` - Retrieve details and comment history for a ticket.
- `POST /api/tickets` - Create a new support ticket.
- `PUT /api/tickets/:ticketId` - Update status and append internal notes.

### 3. Dashboard

- `GET /api/dashboard/overview` - Aggregate dashboard analytics widgets and KPI summaries.

---

## Environment Setup Guide

To run Tixora locally, configure the environment variables as follows.

### 1. Get a PostgreSQL Connection String

Create a database instance on **[Neon DB](https://neon.tech)** (or your local PostgreSQL server) and copy the Connection String:
`postgresql://<user>:<password>@<host>/<database>?sslmode=require`

### 2. Configure Backend Env (`Backend/.env`)

Create a file at `Backend/.env` matching the following configuration:

```env
PORT=4000
DATABASE_URL="postgresql://<user>:<password>@<host>/tixora?sslmode=require"
JWT_SECRET="a-very-long-secret-key-greater-than-32-characters-long"
JWT_EXPIRES_IN="7d"
```

### 3. Configure Frontend Env (`Frontend/.env`)

Create a file at `Frontend/.env` directing the SPA to the API:

```env
VITE_API_URL="http://localhost:4000/api"
```

---

## Local Development Start

Follow these steps to run Tixora on your local machine:

### 1. Install Dependencies

From the repository root, install dependencies across both workspace packages:

```bash
pnpm install
```

### 2. Push Database Schema & Generate Prisma Client

Push the database schema directly to your Neon DB instance:

```bash
pnpm --filter ./Backend build
```

_(This automatically triggers `prisma generate` and runs TypeScript compiler)._

To push the tables to the database:

```bash
npx prisma db push --schema=Backend/prisma/schema.prisma
```

### 3. Seed Mock Data

Seed the database with default admin accounts, tickets, activities, and dashboard data:

```bash
pnpm --filter ./Backend seed
```

### 4. Start Development Servers

Start both the backend API and frontend Vite servers concurrently:

```bash
# In one terminal tab: Start NestJS Backend
pnpm --filter ./Backend dev

# In another terminal tab: Start React Frontend
pnpm --filter ./Frontend dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to interact with the application.

### Seed Credentials

You can log in using these seeded agent profiles:

- **Admin**:
  - Email: `admin@tixora.local`
  - Password: `admin123!`
- **Agent 1**:
  - Email: `sales@tixora.local`
  - Password: `sales123!`
- **Agent 2**:
  - Email: `aadigunjal0975@gmail.com`
  - Password: `aaditya123!`
