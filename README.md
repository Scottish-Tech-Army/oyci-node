# OYCI Operations Platform

An internal operations platform for [OYCI](https://oyci.org.uk), a youth charity. It replaces spreadsheet-based scheduling with a purpose-built tool for staff rostering, session planning, leave tracking, and reporting.

---

## What It Does

- **Rota Management** — assign staff to sessions based on availability, skills, and contract type. Prevents double-booking and flags gaps.
- **Session Planning** — create and manage programme sessions across school terms and holiday blocks.
- **Staff Management** — maintain staff profiles, skills, qualifications, and contract details.
- **Leave & Availability** — record leave, view availability at a glance, and auto-update rotas when things change.
- **Calendar & Reporting** — week and month views for upcoming sessions, plus historical records and attendance tracking.

---

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite                      |
| **Backend**  | Express.js, TypeScript                          |
| **Database** | SQLite (WASM — no native bindings, fully portable) |
| **Auth**     | JWT + bcrypt, role-based (admin / staff)        |
| **Validation** | Zod schemas on all API inputs                |

No external services required — the entire app is self-contained.

---

## Project Structure

```
techForGood/
├── backend/                # Express API server
│   └── src/
│       ├── modules/        # Feature modules (auth, users, sessions, leave)
│       │   └── {module}/
│       │       ├── *.routes.ts       # API endpoints
│       │       ├── *.service.ts      # Business logic
│       │       ├── *.repository.ts   # Database queries
│       │       └── *.schemas.ts      # Zod validation
│       ├── middleware/     # Auth, validation, error handling
│       ├── db/             # Database connection, migrations, seed
│       ├── errors/         # Typed application errors
│       └── config.ts       # Environment configuration
│
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── features/       # Feature modules
│       │   ├── rota/       # Rota planner (drag-and-drop scheduling)
│       │   ├── calendar/   # Calendar views (week/month)
│       │   ├── sessions/   # Session management
│       │   ├── leave/      # Leave requests
│       │   ├── admin/      # User management (admin only)
│       │   └── auth/       # Login page
│       ├── app/            # Shell, routing, permissions
│       └── services/       # API client, auth context
│
├── LOCAL_SETUP.md          # How to run locally
├── DEPLOY_RAILWAY.md       # How to deploy on Railway
└── problem.md              # Original requirements
```

Each backend module follows a consistent layered pattern: **routes → service → repository → database**. Each frontend feature is self-contained with its own pages, components, and data models.

---

## How It Works

### Architecture

The frontend is a static single-page app that talks to the backend via REST APIs under `/api/v1`. The backend stores everything in a single SQLite file — no separate database server needed.

### Authentication

Users log in with email and password. The backend issues a JWT token which the frontend stores in localStorage and sends with every request. Two roles control access:

- **Admin** — can manage users, create sessions, build rotas
- **Staff** — can view their schedule, manage their own account

### Request Flow

```
Browser → React SPA → fetch(/api/v1/...) → Express Router
  → requireAuth → requireRole → validateBody → Service → Repository → SQLite
```

---

## Getting Started

### Run Locally

See **[LOCAL_SETUP.md](LOCAL_SETUP.md)** — install Node.js, install dependencies, seed the database, and start two terminals.

### Deploy to Production

See **[DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md)** — deploy both services to Railway with persistent storage for ~£5/month.

### Default Login

After seeding, log in with:

| Field    | Value               |
| -------- | ------------------- |
| Email    | admin@oyci.internal |
| Password | Dev@dmin123!        |

---

## Environment Variables

All configuration is via environment variables with sensible defaults for development:

| Variable         | Default                          | Required in Production |
| ---------------- | -------------------------------- | ---------------------- |
| `JWT_SECRET`     | dev fallback                     | **Yes**                |
| `PORT`           | `3001`                           | No                     |
| `DB_FILE`        | `./data/oyci.db`                 | No                     |
| `CORS_ORIGINS`   | `http://localhost:5173`          | Yes                    |
| `NODE_ENV`       | `development`                    | Recommended            |

---

## Scripts

### Frontend (from repo root)

```sh
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + production build
npm run lint         # ESLint
```

### Backend (from `backend/`)

```sh
npm run dev          # Start with auto-reload
npm run build        # Compile TypeScript
npm run test         # Run all tests
npm run migrate      # Run database migrations
npm run seed         # Seed sample data
npm run lint         # ESLint
```