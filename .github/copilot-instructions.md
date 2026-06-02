# Copilot Instructions

## Project Overview

Internal operations platform for a youth charity (OYCI) — staff scheduling, session planning, rota management, attendance tracking, and reporting. Monorepo with a React frontend and Express backend sharing no code between them.

Treat `problem.md` as core project context. Read it alongside `README.md` and the relevant frontend/backend docs before making product, UX, or workflow decisions.

## Repository Agents

- Use `.github/agents/react-vite-linter.agent.md` for frontend ESLint and code quality work in the Vite app.
- Use `.github/agents/techforgood-bug-fixer.agent.md` for debugging and fixing frontend/backend bugs. That agent is expected to read the Markdown docs first, especially `problem.md`, `README.md`, `.github/copilot-instructions.md`, `frontend/planInstructions.md`, and the docs folders before changing behavior.
- Use `.github/agents/oyci-ui-designer.agent.md` for polished, accessible UI work that should match OYCI's visual style while staying practical for internal staff workflows.

## Build, Test, and Lint

### Frontend (from repo root)

```sh
npm run dev          # Vite dev server (localhost:5173)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint (flat config, frontend only)
```

### Backend (from `backend/`)

```sh
npm run dev          # ts-node-dev with auto-reload
npm run build        # TypeScript compile to dist/
npm run test         # Jest (all tests, sequential via --runInBand)
npm run test -- --testPathPattern=modules/staff   # Run tests for one module
npm run test:watch   # Jest in watch mode
npm run lint         # ESLint on src/**/*.ts
npm run migrate      # Run SQLite migrations
npm run seed         # Seed database
```

## Architecture

### Backend (`backend/src/`)

Express + TypeScript. All API routes are versioned under `/api/v1`. SQLite database (node-sqlite3-wasm) with WAL mode, stored at the path in `DB_FILE` env var (default `./data/oyci.db`).

**Module pattern** — each domain module in `modules/` follows a layered structure:

- `{module}.routes.ts` — Express router, applies auth/validation middleware
- `{module}.service.ts` — Business logic, called by routes
- `{module}.repository.ts` — Raw SQLite queries, called by services
- `{module}.schemas.ts` — Zod schemas for request validation + inferred DTO types

When adding a new module, follow this exact structure and register the router in `app.ts`.

**Middleware chain** on protected routes: `requireAuth` → `requireRole(...)` → `validateBody(schema)` → handler. Auth uses JWT in `Authorization: Bearer <token>` headers (not cookies).

**Error handling** — throw typed errors from `src/errors/`:
- `ValidationError` (400), `AuthenticationError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `BusinessRuleError` (422)
- The central `errorHandler` middleware catches these and returns structured `{ error, code, details? }` JSON.

**Migrations** are sequential functions tracked in a `_migrations` table — add new ones at the end of the array in `src/db/migrate.ts`.

### Frontend (`frontend/src/`)

React 19 + TypeScript + Vite. No external state management or routing library yet — uses internal route config and React state.

- `app/routes/routeConfig.ts` — Declarative route definitions with `path`, `section`, and `allowedRoles`
- `app/security/permissions.ts` — Client-side access checks (`canAccessRoute`)
- `app/layout/` — App shell with sidebar navigation
- `features/` — Feature modules (currently `auth/`)

Roles are `'admin' | 'staff'`. Route access is filtered by role both in navigation rendering and route resolution.

## Key Conventions

- **Zod for all request validation** — define schemas in `*.schemas.ts`, apply via `validateBody()` or `validateQuery()` middleware. Infer TypeScript types from schemas with `z.infer<>`.
- **UUIDs for all entity IDs** — generated server-side.
- **ISO 8601 timestamps** throughout the database.
- **Backend uses CommonJS** (`module: "commonjs"` in tsconfig). Frontend uses ESM (`"type": "module"` in root package.json).
- **Two roles only**: `admin` and `staff`. Backend enforces via `requireRole()`; frontend filters UI elements.
- **Config via environment variables** — see `backend/src/config.ts`. Key vars: `JWT_SECRET`, `PORT` (default 3001), `DB_FILE`, `CORS_ORIGINS`.
