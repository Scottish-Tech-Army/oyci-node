# Frontend — DB/API Connection Readiness

This document replaces the earlier calendar-only note and tracks what is required for the frontend to connect cleanly to the real backend and SQLite database instead of mock or sample data.

It currently covers:

- the shared frontend/API contract already in the codebase
- the current calendar integration gaps
- the current rota planner integration gaps
- the concrete steps needed before the rota planner can use SQLite-backed data

---

## Summary

The frontend is **partially connected** to the backend today:

- authentication and user management already use live API calls
- the Calendar page still uses frontend sample data
- the Rota Planner currently has a **Phase 1 mock foundation only** and is not yet connected to live endpoints

The most important blocker is not in the frontend. The backend currently has **schema drift**:

- the repositories and services expect tables such as `staff_members`, `rota_assignments`, `availability_records`, `session_skill_requirements`, and session fields such as `session_date`, `start_time`, `end_time`, `status`, `min_staff`
- `backend/src/db/migrate.ts` currently defines an older, different schema using tables such as `staff_allocation`, `staff_availability`, and a `sessions` table shaped around `start_time` / `end_time` datetimes

Until the backend migrations and backend repositories describe the same schema, neither the Calendar page nor the Rota Planner can be considered SQLite-ready.

---

## Current frontend/API state

| Area | Frontend state | Backend/API state | SQLite readiness |
|---|---|---|---|
| Auth | Live | Live | 🟢 |
| User management | Live | Live | 🟢 |
| Calendar | Uses `sampleEvents.ts` | No calendar-shaped endpoint yet | 🔴 |
| Rota planner | Phase 1 only: types, mock data, mock service, stub page | Existing rota/session/staff routes exist, but no planner-ready aggregate API | 🔴 |

---

## Shared frontend/API contract already in the repo

### 1. API base and auth

The frontend already has a shared API helper:

- file: `frontend/src/services/api.ts`
- base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`
- auth model: Bearer token in `Authorization` header

The backend route pattern is:

```txt
/api/v1/...
```

The backend usually returns:

```ts
{ data: ... }
```

That should remain the standard for new calendar and rota endpoints so the frontend stays consistent.

### 2. Recommended frontend pattern for all new feature connections

For new live data connections:

1. Keep page components focused on UI
2. Put backend calls in feature service files
3. Normalize backend responses in the service layer, not in every component
4. Preserve one interface per feature where possible

That is already the direction the rota planner started with in:

```txt
frontend/src/features/rota/services/rota.api.ts
```

---

## Cross-cutting blocker: backend schema drift

This is the first issue to resolve before any serious frontend-to-SQLite work.

### What the backend repositories/services currently expect

From the module code under `backend/src/modules/`, the live backend logic expects:

- `sessions`
  - `session_date`
  - `start_time`
  - `end_time`
  - `status`
  - `min_staff`
  - `max_staff`
  - `programme_id`
- `staff_members`
- `rota_assignments`
- `availability_records`
- `session_skill_requirements`
- `skills`

### What `backend/src/db/migrate.ts` currently creates

The migration file currently defines a different model, including:

- `sessions` with `start_time` and `end_time` as full datetime columns
- `staff_allocation`
- `staff_skills` on `user_accounts`
- `staff_availability`

### Why this matters

Even if the frontend were wired today, the backend modules would not be reliably backed by the schema currently created by migrations.

### Required fix

Before connecting Calendar or Rota Planner to SQLite:

1. decide which schema is the source of truth
2. update migrations to match the current repository/service code, or refactor repositories to match the existing migration schema
3. run migrations against a fresh database and verify all existing backend routes work

**Recommendation:** treat the current module/repository layer as the target model, because it better matches the documented product requirements around sessions, staffing, availability, and rota assignments.

---

## Calendar connection readiness

The Calendar page still has a clear path to live data, but it depends on the schema issue above being resolved first.

### Current gap tracker

#### 1 — Missing calendar-shaped endpoint ❗ Critical

| | Detail |
|---|---|
| **Frontend** | `CalendarPage` expects `CalendarEvent[]` with calendar-focused fields |
| **Backend** | Current `GET /api/v1/sessions` returns session rows, not calendar-shaped DTOs |
| **Problem** | The Calendar UI needs derived status, combined date/time values, staff names, and attendance count |
| **Recommended fix** | Add `GET /api/v1/sessions/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| **Status** | 🔴 Not started |

#### 2 — Status mismatch ❗ Critical

| | Detail |
|---|---|
| **Frontend** | `confirmed | planned | staffing-needed` |
| **Backend** | `draft | published | cancelled | completed` |
| **Problem** | Calendar status is not the same as session lifecycle status |
| **Recommended fix** | Return a computed calendar status from the API |
| **Status** | 🔴 Not started |

Suggested logic:

```txt
if session.status = 'draft'         -> planned
if session.status = 'cancelled'     -> omit from calendar response
if session.status = 'completed'     -> confirmed
if confirmed assignments >= minStaff -> confirmed
else                                 -> staffing-needed
```

#### 3 — Date/time shape mismatch ⚠️ Medium

| | Detail |
|---|---|
| **Frontend** | Expects `startsAt` and `endsAt` strings |
| **Backend** | Stores schedule fields differently depending on which schema is finalized |
| **Recommended fix** | Normalize to a frontend-safe datetime string in the API response |
| **Status** | 🔴 Not started |

#### 4 — Staff names and attendance count not included ⚠️ Medium

| | Detail |
|---|---|
| **Frontend** | Needs `staffAssigned` and `attendeeCount` |
| **Backend** | Requires joins/aggregation across rota and attendance data |
| **Recommended fix** | Return those fields directly in the calendar endpoint |
| **Status** | 🔴 Not started |

### Calendar files to update

| File | Change |
|---|---|
| `backend/src/modules/sessions/sessions.routes.ts` | Add calendar route |
| `backend/src/modules/sessions/sessions.service.ts` | Add calendar query/service method |
| `frontend/src/features/calendar/pages/CalendarPage.tsx` | Replace sample data with API-backed loading |
| `frontend/src/services/api.ts` | Add `getCalendarEvents(from, to, token)` helper |

---

## Rota planner — current implementation analysis

The current rota planner work is **Phase 1 only**.

### What already exists in the frontend

#### Implemented

- `frontend/src/features/rota/model/rota.types.ts`
  - base rota domain types
- `frontend/src/features/rota/model/mockSkills.ts`
- `frontend/src/features/rota/model/mockStaff.ts`
- `frontend/src/features/rota/model/mockSessions.ts`
- `frontend/src/features/rota/model/mockAvailability.ts`
- `frontend/src/features/rota/model/mockAssignments.ts`
- `frontend/src/features/rota/model/rota.utils.ts`
  - time/grid helpers
- `frontend/src/features/rota/services/rota.api.ts`
  - `RotaService` interface
  - `MockRotaService` implementation
- `frontend/src/features/rota/pages/RotaPlannerPage.tsx`
  - stub only, not the actual planner UI yet

#### Not implemented yet

- week grid UI
- session drag-and-drop UI
- staff allocation modal UI
- API-backed `ApiRotaService`
- real loading/error states around live rota data

### Good news

The rota planner foundation was intentionally built with a service abstraction, which is the right shape for a later live API swap.

### Important gaps between the current frontend rota model and the current backend

#### 1 — Unscheduled sessions are not currently representable in the live backend ❗ Critical

| | Detail |
|---|---|
| **Frontend rota design** | Left panel contains unscheduled sessions where `session_date`, `start_time`, and `end_time` can be `null` |
| **Current backend session DTO/schema** | `createSessionSchema` requires `sessionDate`, `startTime`, and `endTime` |
| **Current backend repository shape** | `SessionRow` uses non-null `session_date`, `start_time`, `end_time` |
| **Problem** | The current SQLite/API model cannot store the unscheduled sessions that the planner UX depends on |
| **Status** | 🔴 Critical blocker |

This is the single biggest rota-specific blocker.

Before live SQLite integration, the product needs one of these decisions:

1. allow `sessions.session_date`, `start_time`, and `end_time` to be nullable for draft/unscheduled sessions, or
2. introduce a separate entity for session templates / planned-but-unscheduled sessions

**Recommendation:** for the current planner design, allow nullable scheduling fields for draft sessions. That matches the planned UX most directly.

#### 2 — Staff shape mismatch ⚠️ Medium

| | Detail |
|---|---|
| **Frontend type** | `contract_type: 'salaried' | 'sessional'`, `is_active: boolean` |
| **Backend shape** | `contract_type_id`, `is_active: number` |
| **Problem** | The frontend mock type is not a direct API response shape |
| **Recommended fix** | Normalize in `ApiRotaService` or return a dedicated frontend DTO from the backend |
| **Status** | 🔴 Not started |

#### 3 — Session skill field mismatch ⚠️ Medium

| | Detail |
|---|---|
| **Frontend type** | `required_skills: Skill[]` |
| **Backend `get(id)`** | returns `skillRequirements` |
| **Backend `list()`** | returns raw session rows without skill requirements |
| **Problem** | The planner needs skill requirements on list/grid data, not only on single fetch |
| **Recommended fix** | Provide planner session DTOs with required skills already attached |
| **Status** | 🔴 Not started |

#### 4 — Assignment response mismatch ⚠️ Medium

| | Detail |
|---|---|
| **Frontend type** | `AssignmentWithStaff` expects nested `staff` object |
| **Backend rota route** | session assignment query currently returns flat joined rows |
| **Problem** | The frontend modal will need either mapping logic or a cleaner backend DTO |
| **Recommended fix** | Return `assignment + staff` in a stable planner DTO or map in `ApiRotaService` |
| **Status** | 🔴 Not started |

#### 5 — Missing planner-specific aggregate endpoints ❗ Critical

The current backend has useful low-level endpoints:

- `GET /api/v1/sessions`
- `GET /api/v1/sessions/:id`
- `GET /api/v1/staff`
- `GET /api/v1/availability/staff/:staffId`
- `GET /api/v1/rota/sessions/:sessionId`
- `POST /api/v1/rota/assignments`
- `DELETE /api/v1/rota/assignments/:id`

But the planner UI needs aggregated read models, not many small calls.

If the frontend loads one week and one session modal using only existing low-level routes, it will likely create:

- N+1 session enrichment calls
- N+1 staff availability checks
- duplicated business-rule logic between frontend and backend

That is not a good planner architecture.

---

## Recommended SQLite/API plan for the rota planner

### Step 0 — Align backend schema and migrations ❗ Mandatory first step

Update `backend/src/db/migrate.ts` so it matches the schema expected by the current repositories and services, or refactor the repositories to match the migration schema.

Without this, live SQLite work is unsafe.

### Step 1 — Decide how unscheduled sessions are persisted ❗ Mandatory product/data decision

The planner UX depends on sessions existing before they are placed on the week grid.

Recommended route:

- keep a single `sessions` table
- allow `session_date`, `start_time`, and `end_time` to be nullable when `status = 'draft'`
- keep validation strict for published sessions

That supports:

- sessions visible in the left panel before placement
- drag from left panel into week grid
- unscheduling back to the left panel later if needed

### Step 2 — Add planner-specific read endpoints

Recommended endpoints:

```txt
GET /api/v1/rota/planner/week?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /api/v1/rota/planner/unscheduled?month=MM&year=YYYY
GET /api/v1/rota/planner/sessions/:sessionId
GET /api/v1/rota/planner/sessions/:sessionId/available-staff
```

Suggested responsibilities:

- `week`
  - return scheduled sessions for the visible week
  - include required skills
  - include assignment summary/counts
- `unscheduled`
  - return left-panel sessions only
- `sessions/:id`
  - return modal-ready session detail
  - include full assignment list and staffing status
- `available-staff`
  - return only staff who are active and not unavailable
  - optionally include warnings for over-allocation or skill gaps

### Step 3 — Add schedule/unschedule session mutations

Recommended endpoints:

```txt
PATCH /api/v1/sessions/:id/schedule
PATCH /api/v1/sessions/:id/unschedule
```

Why:

- dragging a session onto the grid is not a generic session update from the UI’s perspective
- explicit endpoints make audit logging and validation clearer

Suggested `schedule` body:

```ts
{
  sessionDate: string
  startTime: string
  endTime: string
}
```

### Step 4 — Keep staff assignment as the source of truth in the backend

The existing backend rota service already enforces:

- availability
- max staffing cap
- over-allocation warning/error
- sessional proposed vs confirmed logic

That is good. The frontend should not reimplement the hard rules.

Instead:

- keep `POST /api/v1/rota/assignments`
- keep `DELETE /api/v1/rota/assignments/:id`
- optionally add a planner-specific read endpoint that precomputes warnings for display

### Step 5 — Implement `ApiRotaService` in the frontend

Create a real implementation beside the existing mock service:

```txt
frontend/src/features/rota/services/rota.api.ts
```

That class should:

- call the new planner endpoints
- normalize backend DTOs into the current frontend types
- keep all mapping logic in one place

Recommended additions:

| Method | Notes |
|---|---|
| `getWeekSessions(weekStart)` | Call planner week endpoint |
| `getUnscheduledSessions()` | Call planner unscheduled endpoint |
| `getAvailableStaffForSession(...)` | Call available-staff endpoint |
| `scheduleSession(...)` | Call schedule endpoint |
| `unscheduleSession(...)` | Call unschedule endpoint |
| `assignStaff(...)` | Call existing rota assignment endpoint |
| `removeAssignment(...)` | Call existing delete endpoint |
| `getSessionAssignments(...)` | Prefer modal-ready session detail endpoint |
| `checkDoubleBooking(...)` | Prefer backend-computed warning in available-staff/session detail response rather than a separate client-side call |

### Step 6 — Add shared API helpers where useful

`frontend/src/services/api.ts` currently has:

- `apiCall(...)`
- `usersAPI`

Either:

1. keep feature-specific service files only, or
2. add a small `rotaAPI` helper object there

Either approach is fine, but avoid spreading rota fetch logic across page components.

### Step 7 — Swap the service export only when endpoints are ready

The intended final switch remains:

```ts
export const rotaService: RotaService = new ApiRotaService()
```

That is the right seam and should be preserved.

---

## Recommended backend/frontend file changes for live rota data

### Backend

| File | Change |
|---|---|
| `backend/src/db/migrate.ts` | Align actual SQLite schema with repository/service expectations |
| `backend/src/modules/sessions/sessions.schemas.ts` | Support unscheduled draft sessions or introduce an alternate draft schema |
| `backend/src/modules/sessions/sessions.routes.ts` | Add schedule/unschedule endpoints |
| `backend/src/modules/sessions/sessions.service.ts` | Add schedule/unschedule logic and planner-shaped DTO support if sessions own scheduling |
| `backend/src/modules/rota/rota.routes.ts` | Add planner read endpoints |
| `backend/src/modules/rota/rota.service.ts` | Add week/unscheduled/modal-ready planner queries |
| `backend/src/modules/rota/rota.repository.ts` | Add aggregate planner queries |

### Frontend

| File | Change |
|---|---|
| `frontend/src/features/rota/services/rota.api.ts` | Add `ApiRotaService` and response normalization |
| `frontend/src/features/rota/model/rota.types.ts` | Revisit field names if frontend DTOs should match API DTOs instead of DB-like mocks |
| `frontend/src/features/rota/pages/RotaPlannerPage.tsx` | Replace stub with planner UI once Phases 2–4 are built |
| `frontend/src/services/api.ts` | Optionally add shared helper methods for calendar/rota |
| `frontend/src/features/calendar/pages/CalendarPage.tsx` | Replace sample data once calendar endpoint exists |

---

## Suggested order of work

1. align backend migrations with backend repositories
2. decide how unscheduled sessions are stored
3. add planner aggregate read endpoints
4. add session schedule/unschedule endpoints
5. implement `ApiRotaService`
6. connect Calendar to live endpoint
7. continue Rota Planner Phases 2–5 against the real service layer

---

## Status key

| Symbol | Meaning |
|---|---|
| 🔴 Not started | Work not yet begun |
| 🟡 In progress | Work underway |
| 🟢 Done | Resolved and verified |

