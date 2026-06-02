# OYCI Staff Scheduling Platform - Documentation

This document describes the current functionality, architecture, and day-to-day usage of the application in this repository.

It is written from the implemented code in `frontend\src` and `backend\src`, with supporting context from `problem.md`, `.github\copilot-instructions.md`, `frontend\planInstructions.md`, and `frontend\docs\`.

> Current-state note: some planning documents describe future phases or earlier assumptions. Where planning notes differ from the live code, this document reflects the code that is currently implemented.

## 1. What this application is for

The OYCI Staff Scheduling Platform is an internal web application for Ochil Youths Community Improvement (OYCI).

Its purpose is to reduce the spreadsheet-heavy manual work involved in:

- planning sessions
- reviewing upcoming delivery in a calendar
- preparing weekly rota views
- managing internal user accounts
- supporting future staff allocation, reporting, and attendance workflows

The app is intended for internal staff only, especially office managers and back-office staff. It is not a public-facing booking system.

### Out of scope

The current product direction explicitly does **not** replace:

- parent or child registration
- public booking flows
- external systems such as Zoho, Bookeo, or Xero
- payroll calculation
- a full CRM or HR platform

## 2. Current feature summary

The app is split into shared, operations, and admin areas defined in `frontend\src\app\routes\routeConfig.ts`.

| Area | Route | Roles | Status | What it does today |
| --- | --- | --- | --- | --- |
| Login | App entry | Admin, Staff | Live | Authenticates against `POST /api/v1/auth/login` and stores a JWT in local storage |
| Calendar | `/calendar` | Admin, Staff | Live | Displays sessions in month and week views using live backend session data |
| Rota Planner | `/rota` | Admin, Staff | Partial | Shows a weekly planning view fed by live scheduled sessions, but staffing actions are not fully wired |
| Sessions | `/sessions` | Admin, Staff | Live/Partial | Lists saved sessions and provides a create-session modal; creation is backend-admin-only |
| Staff | `/staff` | Admin, Staff | Placeholder | Route exists, page content is scaffold only |
| Reporting | `/reporting` | Admin, Staff | Placeholder | Route exists, page content is scaffold only |
| User Management | `/admin/users` | Admin only | Live | Create users and view user accounts |
| My Account | `/my-account` | Admin, Staff | Placeholder | Route exists, page content is scaffold only |

## 3. Roles and permissions

The app uses two roles:

- `admin`
- `staff`

Role-based access is enforced in two places:

- the frontend hides or shows routes using `frontend\src\app\security\permissions.ts`
- the backend enforces protected access with `requireAuth`, `requireRole`, and `requireAdmin` in `backend\src\middleware\auth.middleware.ts`

### What admins can do

- log in
- view calendar
- use the rota planner view
- view the sessions list
- create sessions through the sessions page
- access user management
- create and update users through backend APIs

### What staff can do

- log in
- view calendar
- use the rota planner view shell
- view the sessions list
- view placeholder pages for Staff, Reporting, and My Account

### Important nuance

The Sessions page is visible to both roles, and the "Create session" button is currently shown to both roles in the UI. However, the backend protects `POST /api/v1/sessions` with `requireAdmin`, so a staff user will receive a permission error if they try to save a new session.

## 4. What is implemented today

### 4.1 Authentication

Implemented in:

- `frontend\src\services\auth.context.tsx`
- `frontend\src\features\auth\pages\LoginPage.tsx`
- `backend\src\modules\auth\`

What it does:

- shows a login page when no token and user are present
- signs users in with email and password
- receives an access token and user object from the backend
- stores both in local storage under `authToken` and `authUser`
- supports logout by clearing local storage

Important behavior:

- auth uses JWT bearer tokens, not cookie-based auth
- the login page includes seeded demo credentials
- the app shows a session-expired message when auth state is set to expired
- there is no refresh-token-based re-auth flow yet, even though a `refresh_tokens` table exists in the database

### 4.2 Calendar

Implemented in:

- `frontend\src\features\calendar\pages\CalendarPage.tsx`
- `frontend\src\features\calendar\components\`
- `backend\src\modules\sessions\`

What it does:

- loads live sessions from `GET /api/v1/sessions`
- maps backend session rows into frontend calendar events
- shows:
  - a month toolbar
  - a current-week strip
  - an expanded weekly view
  - a month event list
  - event details in a modal

What the calendar displays:

- session title
- start and end time
- location
- notes
- attendee count
- inferred status
- assigned staff list when returned by the backend session service

Status logic in the frontend is currently lightweight:

- sessions with assigned staff are shown as `confirmed`
- standard sessions without staff are shown as `planned`
- non-standard sessions without staff are shown as `staffing-needed`

### 4.3 Sessions page

Implemented in:

- `frontend\src\features\sessions\pages\SessionsPage.tsx`
- `frontend\src\services\api.ts`
- `backend\src\modules\sessions\`

What it does:

- loads all sessions for the signed-in user
- displays them in a table
- opens a modal to create a new session

Current create-session fields:

- title
- description
- session type
- start time
- end time
- location
- notes
- planned attendees

After a successful save, the page refreshes the session list and shows a success message.

### 4.4 Rota planner

Implemented in:

- `frontend\src\features\rota\pages\RotaPlannerPage.tsx`
- `frontend\src\features\rota\services\rota.api.ts`
- `frontend\src\features\rota\components\`

What is live today:

- month, year, and week selection
- weekly schedule grid
- staffing queue for the selected week
- live loading of scheduled sessions using:

```txt
GET /api/v1/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
```

What is not fully live yet:

- unscheduled sessions feed
- scheduling and unscheduling sessions
- live staff lookup for a selected session
- live assignment creation and removal
- standalone double-booking checks surfaced to the planner UI

The planner service is intentionally split into a live API-backed path and a placeholder path. The current boundary is:

- **live**: reading scheduled sessions for a week
- **placeholder/not yet implemented**: planner-specific staffing actions

That means the planner is useful today as a weekly visibility tool, but not yet as a fully operational assignment console.

### 4.5 User management

Implemented in:

- `frontend\src\features\admin\pages\UserManagementPage.tsx`
- `backend\src\modules\users\`

What it does:

- lists current user accounts
- lets an admin create a new user with:
  - email
  - password
  - role (`role_staff` or `role_admin`)

The backend creates the user, hashes the password, and stores the account in `user_accounts`.

### 4.6 Placeholder routes

The following routes exist in navigation, but do not yet have dedicated feature pages:

- `/staff`
- `/reporting`
- `/my-account`

When opened, the shell shows a generic "page scaffold ready" placeholder.

## 5. Running the application locally

### 5.1 Prerequisites

- Node.js and npm
- access to install packages for both the frontend and backend

### 5.2 Install dependencies

From the repository root:

```powershell
npm install
```

From the backend directory:

```powershell
Set-Location .\backend
npm install
```

### 5.3 Start the backend

From `backend\`:

```powershell
npm run migrate
npm run seed
npm run dev
```

Default backend behavior:

- port: `3001`
- database file: `.\data\oyci.db`
- CORS origin: `http://localhost:5173`

### 5.4 Start the frontend

From the repository root:

```powershell
npm run dev
```

This starts the Vite frontend, typically on:

```txt
http://localhost:5173
```

### 5.5 Useful build, lint, and test commands

Frontend from the repository root:

```powershell
npm run build
npm run lint
```

Backend from `backend\`:

```powershell
npm run build
npm run test
npm run lint
```

### 5.6 Environment variables

### Frontend

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3001` | Base URL for most frontend API calls |

### Backend

Defined in `backend\src\config.ts`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Backend port |
| `JWT_SECRET` | local dev fallback | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | `8h` | Access token lifetime |
| `DB_FILE` | `.\data\oyci.db` | SQLite database location |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Global rate-limit window |
| `RATE_LIMIT_MAX` | `100` | Global rate-limit max requests |
| `AUTH_RATE_LIMIT_MAX` | `10` | Max login attempts per window |

### Important configuration note

Most frontend API calls use `VITE_API_URL` via `frontend\src\services\api.ts`, but the login request in `frontend\src\services\auth.context.tsx` currently posts directly to:

```txt
http://localhost:3001/api/v1/auth/login
```

If the backend host or port changes, update both the environment configuration **and** the login call.

## 6. How to use the app

This section is written for internal operators and testers.

### 6.1 Log in

1. Start the backend and frontend.
2. Open the frontend in the browser.
3. On the login screen, enter a seeded or valid account.
4. Click **Sign In**.
5. If login succeeds, the app opens on the Calendar page.

Seeded demo accounts are provided by `backend\src\db\seed.ts` and surfaced in the login page:

- Admin: `admin@oyci.internal` / `Dev@dmin123!`
- Staff: `staff@oyci.internal` / `St@ff123!`

Additional seeded specialist staff accounts also exist for testing mentoring, workshop, and outreach scenarios.

### 6.2 Log out

1. Click **Log out** in the top-right header.
2. The frontend clears `authToken` and `authUser` from local storage.
3. You are returned to the login screen.

### 6.3 View the calendar

1. Sign in.
2. Open **Calendar** from the left navigation.
3. Use the month navigation controls to move forward or backward.
4. Review the current week strip at the top.
5. Expand the week view if needed.
6. Click an event to open its detail modal.

Use this page to review:

- what sessions are scheduled
- when they happen
- where they happen
- attendee counts
- whether sessions appear staffed or still need attention

### 6.4 Create a user account (admin)

1. Sign in as an admin.
2. Open **User Management** from the Admin section of the navigation.
3. Complete the form:
   - email
   - password
   - role
4. Click **Create User**.
5. Confirm the success message.
6. Verify the new account appears in the user table.

Notes:

- passwords must be at least 10 characters
- the backend stores a hashed password
- the user record is created as active

### 6.5 Review the sessions list

1. Sign in.
2. Open **Sessions** from the Operations section.
3. Review the table of saved sessions.
4. Check the title, date/time, type, location, and attendee count.

This page is the main schedule list view currently implemented.

### 6.6 Create a session (admin)

1. Sign in as an admin.
2. Open **Sessions**.
3. Click **Create session**.
4. Complete the modal fields:
   - title
   - description
   - session type
   - start time
   - end time
   - location
   - notes
   - planned attendees
5. Click the save action in the modal form.
6. After a successful save, confirm the success banner and refreshed list.
7. Open the Rota Planner later to review the session in its scheduled week.

Important:

- session creation is currently backend-admin-only
- staff users can open the page, but saving a new session will fail with a permission error

### 6.7 Review a weekly rota view

1. Sign in.
2. Open **Rota Planner**.
3. Select the month, year, and week to inspect.
4. Review the weekly grid to see scheduled sessions in that week.
5. Review the "Needs staff" queue to see which sessions appear under-staffed.
6. Click a session to open the staffing modal if you want to inspect the intended staffing workflow.

Current limitation:

- the weekly scheduled-session feed is live
- the staffing modal is only partially connected
- planner-specific staff lookup, assignment, and removal actions still surface explicit "not available yet" messages in the live API path

### 6.8 Open placeholder pages

The following pages currently act as route placeholders:

- Staff
- Reporting
- My Account

You can open them from navigation, but they currently show scaffold information rather than operational features.

## 7. Architecture overview

### 7.1 High-level system design

The repository is a monorepo with separate frontend and backend applications:

```txt
Browser
  -> React frontend (frontend\src)
  -> HTTP calls to Express API (backend\src)
  -> SQLite database
```

### 7.2 Frontend architecture

Stack:

- React 19
- TypeScript
- Vite
- local component state plus context
- no external router library

Key frontend files:

- `frontend\src\App.tsx`
- `frontend\src\app\layout\AppShell.tsx`
- `frontend\src\app\routes\routeConfig.ts`
- `frontend\src\app\security\permissions.ts`
- `frontend\src\services\auth.context.tsx`
- `frontend\src\services\api.ts`

Frontend behavior:

- `App.tsx` decides whether to render the login page or the protected app shell
- route selection is held in React state (`activePath`)
- there is no URL-based router yet
- `AppShell.tsx` groups navigation into Shared, Operations, and Admin sections
- visible routes are filtered by role before they are rendered
- page components are mapped manually in `ROUTE_PAGE_COMPONENTS`

### Frontend feature organization

Feature code is grouped by domain:

- `features\auth`
- `features\calendar`
- `features\rota`
- `features\sessions`
- `features\admin`

This keeps feature UI, models, and services close together.

### 7.3 Backend architecture

Stack:

- Express
- TypeScript
- SQLite via `node-sqlite3-wasm`
- Zod for validation
- JWT for auth

Key backend files:

- `backend\src\server.ts`
- `backend\src\app.ts`
- `backend\src\config.ts`
- `backend\src\middleware\`
- `backend\src\modules\auth\`
- `backend\src\modules\users\`
- `backend\src\modules\sessions\`
- `backend\src\db\`

Backend module pattern:

Each main domain follows this structure:

- `*.routes.ts` - route definitions and middleware composition
- `*.service.ts` - business logic
- `*.repository.ts` - raw database access
- `*.schemas.ts` - Zod validation schemas and DTO typing

This pattern is used in the auth, users, and sessions modules.

### 7.4 Request flow

Typical request path:

1. A frontend page triggers an API call.
2. `frontend\src\services\api.ts` adds headers and the bearer token where needed.
3. Express receives the request under `/api/v1`.
4. Middleware applies auth and validation.
5. The route calls the service layer.
6. The service calls the repository layer.
7. The repository reads or writes SQLite.
8. The backend responds with JSON.
9. The frontend updates local UI state.

Successful responses typically use:

```json
{ "data": ... }
```

Errors are handled centrally by backend middleware and returned in structured JSON.

### 7.5 Authentication and authorization architecture

### Frontend auth

- token and user are stored in local storage
- auth state is exposed through `AuthProvider`
- protected pages are shown only when auth state is authenticated

### Backend auth

- JWT bearer token is read from the `Authorization` header
- `requireAuth` verifies the token and populates `req.user`
- `requireRole` and `requireAdmin` enforce role access

### Security middleware in the backend

Configured in `backend\src\app.ts`:

- `helmet`
- `cors`
- `cookie-parser`
- `morgan`
- `express-rate-limit`
- central error handler

### Important auth limitation

There is no shared frontend API interceptor for 401 handling yet. If a token is invalid or expired, individual pages usually surface a raw error message such as `API Error: 401` rather than automatically logging the user out and returning to the login page.

### 7.6 Data model and database

The backend uses SQLite migrations defined in `backend\src\db\migrate.ts`.

Current core tables:

| Table | Purpose |
| --- | --- |
| `roles` | Stores `role_admin` and `role_staff` |
| `user_accounts` | Internal user identities, role linkage, password hash, active status |
| `refresh_tokens` | Token tracking table, currently not used by the active frontend auth flow |
| `sessions` | Scheduled sessions with title, datetime window, location, type, notes, attendees, creator |
| `staff_allocation` | Many-to-many mapping between sessions and users |
| `staff_skills` | Session-type skills linked to staff accounts |
| `staff_availability` | Busy/leave windows for staff |

### Seed data

Development data is inserted by `backend\src\db\seed.ts`.

This includes:

- admin and staff login accounts
- additional specialist staff
- example staff skills
- example availability records
- example sessions
- example staff allocations

## 8. API overview

All main API routes are versioned under:

```txt
/api/v1
```

### 8.1 Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Simple health check |

### 8.2 Auth

Defined in `backend\src\modules\auth\auth.routes.ts`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | No | Sign in and receive JWT + user |
| `POST` | `/api/v1/auth/logout` | Yes | Semantic logout endpoint |
| `GET` | `/api/v1/auth/me` | Yes | Returns current authenticated user |
| `POST` | `/api/v1/auth/change-password` | Yes | Change password |

### 8.3 Users

Defined in `backend\src\modules\users\users.routes.ts`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users` | Admin | List users |
| `POST` | `/api/v1/users` | Admin | Create user |
| `GET` | `/api/v1/users/:id` | Admin or self | Get one user |
| `PATCH` | `/api/v1/users/:id` | Admin | Update role or active status |

### 8.4 Sessions

Defined in `backend\src\modules\sessions\sessions.routes.ts`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/sessions` | Yes | List sessions, optionally filtered by type and date range |
| `GET` | `/api/v1/sessions/:id` | Yes | Get one session |
| `POST` | `/api/v1/sessions` | Admin | Create session |
| `PATCH` | `/api/v1/sessions/:id` | Admin | Update session |
| `GET` | `/api/v1/sessions/eligible-staff/options` | Yes | Returns currently eligible staff by session type and optional time window |

### Planner endpoints expected by the frontend but not yet implemented

The rota planner service already anticipates these endpoints:

- `GET /api/v1/sessions/unscheduled`
- `PATCH /api/v1/sessions/:id/schedule`
- `PATCH /api/v1/sessions/:id/unschedule`

These are not live in the current backend.

## 9. Known limitations and implementation gaps

These are the most important current gaps to understand before operating or extending the app.

### 9.1 Frontend limitations

- no URL router or deep linking yet
- no global 401 handling or token refresh flow
- login uses a hard-coded backend URL rather than the shared API helper
- Staff, Reporting, and My Account are placeholder pages
- session creation is not hidden for staff users even though the backend correctly blocks it

### 9.2 Rota planner limitations

- week visibility is live, but staffing actions are not fully implemented
- opening the staffing modal on the live API path currently leads to explicit "not available yet" planner messages for assignment-related operations
- unscheduled-session planning is not yet supported by backend routes
- no fully live drag-and-drop or publish workflow exists

### 9.3 Account-management limitations

- user creation is live
- account listing is live
- there is no dedicated frontend flow yet for:
  - forced password reset
  - self-service profile editing
  - deactivation workflows with confirmation detail

### 9.4 Reporting limitations

- reporting route exists, but reporting features are not implemented
- no attendance capture workflow is exposed in the frontend
- no export workflow is exposed in the frontend

## 10. Troubleshooting notes

### I cannot log in

Check the following:

- the backend is running on port `3001`
- migrations have been applied
- seed data has been inserted
- you are using one of the seeded credentials or a valid created account

### I see `API Error: 401`

This usually means:

- there is no valid bearer token
- the token is expired or invalid
- the backend rejected the request

Current recovery path:

1. log out
2. sign in again
3. retry the action

There is not yet a central auto-retry or auto-logout mechanism for all API requests.

### I see `API Error: 403` when creating a session

This is expected if you are signed in as a staff user. Session creation is backend-admin-only.

### The calendar or sessions page is empty

Possible causes:

- the database has not been seeded
- no sessions have been created yet
- the backend is not running

## 11. Key code references

### Frontend

- `frontend\src\App.tsx`
- `frontend\src\app\layout\AppShell.tsx`
- `frontend\src\app\routes\routeConfig.ts`
- `frontend\src\services\auth.context.tsx`
- `frontend\src\services\api.ts`
- `frontend\src\features\calendar\pages\CalendarPage.tsx`
- `frontend\src\features\rota\pages\RotaPlannerPage.tsx`
- `frontend\src\features\rota\services\rota.api.ts`
- `frontend\src\features\sessions\pages\SessionsPage.tsx`
- `frontend\src\features\admin\pages\UserManagementPage.tsx`

### Backend

- `backend\src\server.ts`
- `backend\src\app.ts`
- `backend\src\config.ts`
- `backend\src\middleware\auth.middleware.ts`
- `backend\src\modules\auth\auth.routes.ts`
- `backend\src\modules\auth\auth.service.ts`
- `backend\src\modules\users\users.routes.ts`
- `backend\src\modules\users\users.service.ts`
- `backend\src\modules\sessions\sessions.routes.ts`
- `backend\src\modules\sessions\sessions.service.ts`
- `backend\src\modules\sessions\sessions.repository.ts`
- `backend\src\db\migrate.ts`
- `backend\src\db\seed.ts`

## 12. Recommended next improvements

The most useful next steps for the application are:

1. add central frontend handling for expired or invalid tokens
2. move login onto the shared API configuration path
3. finish planner-specific backend endpoints for unscheduled sessions and staffing actions
4. hide or disable session creation UI for non-admin users
5. replace the placeholder Staff, Reporting, and My Account pages with real workflows

