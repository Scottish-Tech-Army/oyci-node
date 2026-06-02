/**
 * rota.api.ts — Service abstraction layer
 *
 * INTERFACE: RotaService defines the contract for all rota data operations.
 *
 * MOCK IMPL: MockRotaService implements it using in-memory dummy data that
 *   exactly mirrors the SQLite schema (same field names, enums, relationships).
 *
 * REAL IMPL: When backend endpoints are ready, create ApiRotaService implementing
 *   the same RotaService interface using fetch() calls to /api/v1/. Then replace
 *   the single export at the bottom: `export const rotaService = new ApiRotaService()`
 *
 * No other file needs to change — the interface is the contract.
 */

import { sessionsAPI } from '../../../services/api'
import type {
  Session,
  ScheduledSession,
  SessionStatus,
  StaffMember,
  Assignment,
  AssignmentWithStaff,
} from '../model/rota.types'
import { MOCK_SESSIONS } from '../model/mockSessions'
import { MOCK_STAFF } from '../model/mockStaff'
import { MOCK_AVAILABILITY } from '../model/mockAvailability'
import { MOCK_ASSIGNMENTS } from '../model/mockAssignments'
import { isDateInRange, timesOverlap, toISODate } from '../model/rota.utils'

type LiveScheduledSessionRow = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  session_type: string
  notes: string | null
  /**
   * Used as the min_staff proxy until the backend adds a dedicated min_staff column.
   * TODO(backend-min-staff): replace with `min_staff: number | null` once available.
   */
  attendees: number | null
  staffAssigned?: string[]
}

type LiveUnscheduledSessionRow = {
  id: string
  title: string
  description: string | null
  start_time?: string | null
  end_time?: string | null
  location: string | null
  session_type: string
  notes: string | null
  /**
   * Used as the min_staff proxy until the backend adds a dedicated min_staff column.
   * TODO(backend-min-staff): replace with `min_staff: number | null` once available.
   */
  attendees: number | null
}

type LiveSessionType = 'standard' | 'mentoring' | 'workshop' | 'outreach'

type LiveStaffReference = {
  id: string
  email: string
}

type LiveSessionDetailRow = LiveScheduledSessionRow & {
  assignedStaffUsers?: LiveStaffReference[]
}

export type RotaIntegrationCapability = {
  id: 'scheduled-read' | 'unscheduled-read' | 'schedule-write' | 'unschedule-write'
  label: string
  endpoint: string
  status: 'live' | 'placeholder'
  detail: string
}

export const ROTA_INTEGRATION_CAPABILITIES: RotaIntegrationCapability[] = [
  {
    id: 'scheduled-read',
    label: 'Scheduled sessions feed',
    endpoint: 'GET /api/v1/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD',
    status: 'live',
    detail: 'Confirmed in the current backend. The rota week shell now uses this same feed as Calendar.',
  },
  {
    id: 'unscheduled-read',
    label: 'Unscheduled sessions feed',
    endpoint: 'GET /api/v1/sessions/unscheduled',
    status: 'placeholder',
    detail: 'Not present in the current backend yet. The frontend service seam is ready and returns a clear placeholder error until implemented.',
  },
  {
    id: 'schedule-write',
    label: 'Schedule session mutation',
    endpoint: 'PATCH /api/v1/sessions/:id/schedule',
    status: 'placeholder',
    detail: 'Not present in the current backend yet. The frontend contract is ready and will call it once the backend team adds the endpoint.',
  },
  {
    id: 'unschedule-write',
    label: 'Unschedule session mutation',
    endpoint: 'PATCH /api/v1/sessions/:id/unschedule',
    status: 'placeholder',
    detail: 'Not present in the current backend yet. The frontend contract is ready and will call it once available.',
  },
]

// ─── Interface ────────────────────────────────────────────────────────────────

export interface RotaService {
  /** All sessions placed on the week grid (have a session_date matching the week) */
  getWeekSessions(weekStart: Date): Promise<ScheduledSession[]>

  /** Sessions not yet placed (session_date is null) */
  getUnscheduledSessions(): Promise<Session[]>

  /**
   * Staff available for a specific session slot.
   * Excludes staff with an AvailabilityRecord covering the session date.
   */
  getAvailableStaffForSession(
    sessionId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<StaffMember[]>

  /** Place a session onto the week grid at a specific date/time */
  scheduleSession(
    sessionId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<Session>

  /** Remove a session from the grid (makes it unscheduled again) */
  unscheduleSession(sessionId: string): Promise<void>

  /** Assign a staff member to a session */
  assignStaff(sessionId: string, staffId: string): Promise<Assignment>

  /** Remove a staff assignment */
  removeAssignment(assignmentId: string): Promise<void>

  /** Get all assignments for a session, enriched with staff details */
  getSessionAssignments(sessionId: string): Promise<AssignmentWithStaff[]>

  /**
   * Check if a staff member would be double-booked at the given date/time.
   * Returns true if a conflict exists.
   */
  checkDoubleBooking(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeSessionId?: string,
  ): Promise<boolean>

  /**
   * Auto-assign available staff to a session until the minimum staffing
   * requirement is met or the available pool is exhausted.
   *
   * Rules:
   *  - Already-assigned staff are excluded (caller must provide `availableStaff`
   *    with already-assigned staff already filtered out).
   *  - At most `needed` staff are assigned (needed = minStaff − activeAssignments).
   *  - If fewer than `needed` eligible staff are available the method assigns all
   *    available and returns `isPartial: true` so the UI can surface the gap.
   *  - If `activeAssignments >= minStaff` no assignments are made.
   */
  autoAssignToMinimum(
    sessionId: string,
    minStaff: number,
    activeAssignmentCount: number,
    availableStaff: StaffMember[],
  ): Promise<AutoAssignResult>
}

export type AutoAssignResult = {
  /** Number of staff actually assigned in this call. */
  assignedCount: number
  /** How many staff were needed to meet the minimum at the start of the call. */
  neededCount: number
  /** True when available staff was insufficient to fully cover the minimum. */
  isPartial: boolean
  /** True when the session was already staffed to minimum before this call. */
  alreadyMet: boolean
}

function parseLiveDateTime(dateTime: string) {
  const parsed = new Date(dateTime)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid session datetime received from API: ${dateTime}`)
  }

  return {
    date: toISODate(parsed),
    time: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
  }
}

function inferLiveSessionStatus(session: LiveScheduledSessionRow): SessionStatus {
  return (session.staffAssigned?.length ?? 0) > 0 ? 'published' : 'draft'
}

function mapLiveUnscheduledSession(session: LiveUnscheduledSessionRow): Session {
  // Use attendees as the min_staff proxy until the backend adds min_staff.
  // TODO(backend-min-staff): swap to `session.min_staff ?? 1` once available.
  const minStaff = session.attendees ?? 1

  return {
    id: session.id,
    programme_id: null,
    title: session.title,
    description: session.description,
    session_date: null,
    start_time: null,
    end_time: null,
    location: session.location ?? 'Unspecified',
    status: 'draft',
    min_staff: minStaff,
    max_staff: 0,   // 0 = no enforced maximum until backend provides one
    session_type: session.session_type,
    notes: session.notes,
    required_skills: [],
  }
}

function mapLiveScheduledSession(session: LiveScheduledSessionRow): ScheduledSession {
  const start = parseLiveDateTime(session.start_time)
  const end = parseLiveDateTime(session.end_time)
  const assignedCount = session.staffAssigned?.length ?? 0

  // Use attendees as the stable min_staff source instead of inferring from assignment count.
  // Inferring from assignments was unreliable: it made min_staff a moving target as staff
  // were added/removed rather than a fixed session requirement.
  // TODO(backend-min-staff): swap to `session.min_staff ?? 1` once the backend adds the column.
  const minStaff = session.attendees ?? 1

  return {
    id: session.id,
    programme_id: null,
    title: session.title,
    description: session.description,
    session_date: start.date,
    start_time: start.time,
    end_time: end.time,
    location: session.location ?? 'Unspecified',
    status: inferLiveSessionStatus(session),
    min_staff: minStaff,
    max_staff: 0,   // 0 = no enforced maximum until backend provides one
    assigned_staff_count: assignedCount,
    session_type: session.session_type,
    notes: session.notes,
    required_skills: [],
  }
}

function isApiNotImplementedError(error: unknown) {
  return error instanceof Error && error.message === 'API Error: 404'
}

function withPhase1AMessage(error: unknown, message: string): never {
  if (isApiNotImplementedError(error)) {
    throw new Error(message)
  }

  throw error instanceof Error ? error : new Error(message)
}

const ASSIGNMENT_ID_SEPARATOR = '::'

function isLiveSessionType(value: string | null | undefined): value is LiveSessionType {
  return value === 'standard' || value === 'mentoring' || value === 'workshop' || value === 'outreach'
}

function normalizeLiveSessionType(value: string | null | undefined): LiveSessionType {
  return isLiveSessionType(value) ? value : 'standard'
}

function liveDateTimesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return Date.parse(startA) < Date.parse(endB) && Date.parse(endA) > Date.parse(startB)
}

function buildAssignmentId(sessionId: string, staffId: string) {
  return `${sessionId}${ASSIGNMENT_ID_SEPARATOR}${staffId}`
}

function parseAssignmentId(assignmentId: string) {
  const separatorIndex = assignmentId.indexOf(ASSIGNMENT_ID_SEPARATOR)
  if (separatorIndex === -1) {
    throw new Error(`Invalid assignment identifier: ${assignmentId}`)
  }

  return {
    sessionId: assignmentId.slice(0, separatorIndex),
    staffId: assignmentId.slice(separatorIndex + ASSIGNMENT_ID_SEPARATOR.length),
  }
}

function toTitleCase(value: string) {
  if (!value) {
    return ''
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function deriveNameFromEmail(email: string) {
  const [localPart = 'staff'] = email.split('@')
  const nameSegments = localPart.split(/[._-]+/).filter(Boolean)
  const [firstName = 'staff', ...rest] = nameSegments

  return {
    first_name: toTitleCase(firstName),
    last_name: rest.map(toTitleCase).join(' '),
  }
}

function mapLiveStaffMember(staff: LiveStaffReference): StaffMember {
  const derivedName = deriveNameFromEmail(staff.email)

  return {
    id: staff.id,
    first_name: derivedName.first_name,
    last_name: derivedName.last_name,
    email: staff.email,
    contract_type: null,
    contracted_hours_per_week: null,
    skills: [],
    is_active: true,
  }
}

function mapLiveAssignment(sessionId: string, staff: LiveStaffReference): AssignmentWithStaff {
  return {
    id: buildAssignmentId(sessionId, staff.id),
    session_id: sessionId,
    staff_id: staff.id,
    status: 'confirmed',
    staff: mapLiveStaffMember(staff),
  }
}

// ─── Mock implementation ──────────────────────────────────────────────────────

class MockRotaService implements RotaService {
  // In-memory mutable state — mutations are local to this instance
  private sessions: Session[] = structuredClone(MOCK_SESSIONS)
  private assignments: Assignment[] = structuredClone(MOCK_ASSIGNMENTS)

  async getWeekSessions(weekStart: Date): Promise<ScheduledSession[]> {
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return toISODate(d)
    })

    return this.sessions.filter(
      (s): s is ScheduledSession =>
        s.session_date !== null &&
        weekDates.includes(s.session_date) &&
        s.start_time !== null &&
        s.end_time !== null,
    )
  }

  async getUnscheduledSessions(): Promise<Session[]> {
    return this.sessions.filter((s) => s.session_date === null)
  }

  async getAvailableStaffForSession(
    sessionId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<StaffMember[]> {
    void sessionId; void startTime; void endTime  // unused in mock — real impl will filter by time
    return MOCK_STAFF.filter((staff) => {
      if (!staff.is_active) return false
      const isUnavailable = MOCK_AVAILABILITY.some(
        (record) =>
          record.staff_id === staff.id &&
          isDateInRange(date, record.start_date, record.end_date),
      )
      return !isUnavailable
    })
  }

  async scheduleSession(
    sessionId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<Session> {
    const session = this.sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.session_date = date
    session.start_time = startTime
    session.end_time = endTime
    return { ...session }
  }

  async unscheduleSession(sessionId: string): Promise<void> {
    const session = this.sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.session_date = null
    session.start_time = null
    session.end_time = null
    // Remove all assignments for this session
    this.assignments = this.assignments.filter((a) => a.session_id !== sessionId)
  }

  async assignStaff(sessionId: string, staffId: string): Promise<Assignment> {
    const existing = this.assignments.find(
      (a) => a.session_id === sessionId && a.staff_id === staffId,
    )
    if (existing) return { ...existing }

    const assignment: Assignment = {
      id: `assign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      session_id: sessionId,
      staff_id: staffId,
      status: 'proposed',
    }
    this.assignments.push(assignment)
    return { ...assignment }
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    this.assignments = this.assignments.filter((a) => a.id !== assignmentId)
  }

  async getSessionAssignments(sessionId: string): Promise<AssignmentWithStaff[]> {
    return this.assignments
      .filter((a) => a.session_id === sessionId)
      .flatMap((a) => {
        const staff = MOCK_STAFF.find((s) => s.id === a.staff_id)
        if (!staff) return []
        return [{ ...a, staff }]
      })
  }

  async checkDoubleBooking(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeSessionId?: string,
  ): Promise<boolean> {
    const staffAssignments = this.assignments.filter(
      (a) => a.staff_id === staffId && a.session_id !== excludeSessionId,
    )

    return staffAssignments.some((a) => {
      const session = this.sessions.find(
        (s) => s.id === a.session_id && s.session_date === date,
      )
      if (!session?.start_time || !session?.end_time) return false
      return timesOverlap(startTime, endTime, session.start_time, session.end_time)
    })
  }

  async autoAssignToMinimum(
    sessionId: string,
    minStaff: number,
    activeAssignmentCount: number,
    availableStaff: StaffMember[],
  ): Promise<AutoAssignResult> {
    const needed = Math.max(0, minStaff - activeAssignmentCount)

    if (needed === 0) {
      return { assignedCount: 0, neededCount: 0, isPartial: false, alreadyMet: true }
    }

    const toAssign = availableStaff.slice(0, needed)

    for (const staff of toAssign) {
      await this.assignStaff(sessionId, staff.id)
    }

    return {
      assignedCount: toAssign.length,
      neededCount: needed,
      isPartial: toAssign.length < needed,
      alreadyMet: false,
    }
  }
}

class ApiRotaService implements RotaService {
  private readonly token: string
  private readonly sessionDetailCache = new Map<string, Promise<LiveSessionDetailRow>>()
  private readonly sessionsListCache = new Map<string, Promise<LiveScheduledSessionRow[]>>()

  constructor(token: string) {
    this.token = token
  }

  private clearSessionCaches(sessionId?: string) {
    if (sessionId) {
      this.sessionDetailCache.delete(sessionId)
    }

    this.sessionsListCache.clear()
  }

  private async getSessionDetail(sessionId: string): Promise<LiveSessionDetailRow> {
    const cached = this.sessionDetailCache.get(sessionId)
    if (cached) {
      return cached
    }

    const request = sessionsAPI
      .get(sessionId, this.token)
      .then((response) => response.data as LiveSessionDetailRow)
      .catch((error) => {
        this.sessionDetailCache.delete(sessionId)
        throw error
      })

    this.sessionDetailCache.set(sessionId, request)
    return request
  }

  private async listSessions(filters: {
    from?: string
    to?: string
    sessionType?: LiveSessionType
  }): Promise<LiveScheduledSessionRow[]> {
    const key = JSON.stringify({
      from: filters.from ?? null,
      to: filters.to ?? null,
      sessionType: filters.sessionType ?? null,
    })
    const cached = this.sessionsListCache.get(key)
    if (cached) {
      return cached
    }

    const request = sessionsAPI
      .list(this.token, filters)
      .then((response) => (response.data ?? []) as LiveScheduledSessionRow[])
      .catch((error) => {
        this.sessionsListCache.delete(key)
        throw error
      })

    this.sessionsListCache.set(key, request)
    return request
  }

  async getWeekSessions(weekStart: Date): Promise<ScheduledSession[]> {
    const from = toISODate(weekStart)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const to = toISODate(weekEnd)
    const rows = await this.listSessions({ from, to })
    return rows.map(mapLiveScheduledSession)
  }

  async getUnscheduledSessions(): Promise<Session[]> {
    try {
      const response = await sessionsAPI.unscheduled(this.token)
      const rows = (response.data ?? []) as LiveUnscheduledSessionRow[]
      return rows.map(mapLiveUnscheduledSession)
    } catch (error) {
      withPhase1AMessage(
        error,
        'Live unscheduled sessions are not available yet. Phase 1A still requires GET /api/v1/sessions/unscheduled.',
      )
    }
  }

  async getAvailableStaffForSession(
    sessionId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<StaffMember[]> {
    void date
    void startTime
    void endTime

    const session = await this.getSessionDetail(sessionId)
    const response = await sessionsAPI.eligibleStaff(
      {
        startTime: session.start_time,
        endTime: session.end_time,
        sessionType: normalizeLiveSessionType(session.session_type),
      },
      this.token,
    )

    const assignedStaffIds = new Set((session.assignedStaffUsers ?? []).map((staff) => staff.id))
    const rows = (response.data ?? []) as LiveStaffReference[]

    return rows
      .filter((staff) => !assignedStaffIds.has(staff.id))
      .map(mapLiveStaffMember)
  }

  async scheduleSession(
    sessionId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<Session> {
    try {
      const response = await sessionsAPI.schedule(
        sessionId,
        {
          sessionDate: date,
          startTime: `${date}T${startTime}:00`,
          endTime: `${date}T${endTime}:00`,
        },
        this.token,
      )

      this.clearSessionCaches(sessionId)
      return mapLiveScheduledSession(response.data as LiveScheduledSessionRow)
    } catch (error) {
      withPhase1AMessage(
        error,
        'Live session scheduling is not available yet. Phase 1A still requires PATCH /api/v1/sessions/:id/schedule.',
      )
    }
  }

  async unscheduleSession(sessionId: string): Promise<void> {
    try {
      await sessionsAPI.unschedule(sessionId, this.token)
      this.clearSessionCaches(sessionId)
    } catch (error) {
      withPhase1AMessage(
        error,
        'Live session unscheduling is not available yet. Phase 1A still requires PATCH /api/v1/sessions/:id/unschedule.',
      )
    }
  }

  async assignStaff(sessionId: string, staffId: string): Promise<Assignment> {
    const session = await this.getSessionDetail(sessionId)
    const nextStaffIds = [...new Set([...(session.assignedStaffUsers ?? []).map((staff) => staff.id), staffId])]

    await sessionsAPI.update(
      sessionId,
      {
        staffUserIds: nextStaffIds,
      },
      this.token,
    )

    this.clearSessionCaches(sessionId)
    return {
      id: buildAssignmentId(sessionId, staffId),
      session_id: sessionId,
      staff_id: staffId,
      status: 'confirmed',
    }
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    const { sessionId, staffId } = parseAssignmentId(assignmentId)
    const session = await this.getSessionDetail(sessionId)
    const nextStaffIds = (session.assignedStaffUsers ?? [])
      .map((staff) => staff.id)
      .filter((id) => id !== staffId)

    await sessionsAPI.update(
      sessionId,
      {
        staffUserIds: nextStaffIds,
      },
      this.token,
    )

    this.clearSessionCaches(sessionId)
  }

  async getSessionAssignments(sessionId: string): Promise<AssignmentWithStaff[]> {
    const session = await this.getSessionDetail(sessionId)
    return (session.assignedStaffUsers ?? []).map((staff) => mapLiveAssignment(sessionId, staff))
  }

  async checkDoubleBooking(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeSessionId?: string,
  ): Promise<boolean> {
    void date
    void startTime
    void endTime

    if (!excludeSessionId) {
      throw new Error('Live double-booking checks require the current session identifier.')
    }

    const currentSession = await this.getSessionDetail(excludeSessionId)
    const currentAssignment = (currentSession.assignedStaffUsers ?? []).find((assignment) => assignment.id === staffId)

    if (!currentAssignment) {
      throw new Error(`Unable to resolve staff member ${staffId} for double-booking checks.`)
    }

    const currentStart = parseLiveDateTime(currentSession.start_time)
    const currentEnd = parseLiveDateTime(currentSession.end_time)
    const rows = await this.listSessions({ from: currentStart.date, to: currentEnd.date })

    return rows.some((session) => {
      if (session.id === excludeSessionId) {
        return false
      }

      if (!(session.staffAssigned ?? []).includes(currentAssignment.email)) {
        return false
      }

      return liveDateTimesOverlap(currentSession.start_time, currentSession.end_time, session.start_time, session.end_time)
    })
  }

  async autoAssignToMinimum(
    sessionId: string,
    minStaff: number,
    activeAssignmentCount: number,
    availableStaff: StaffMember[],
  ): Promise<AutoAssignResult> {
    const needed = Math.max(0, minStaff - activeAssignmentCount)

    if (needed === 0) {
      return { assignedCount: 0, neededCount: 0, isPartial: false, alreadyMet: true }
    }

    const toAssign = availableStaff.slice(0, needed)

    for (const staff of toAssign) {
      await this.assignStaff(sessionId, staff.id)
    }

    return {
      assignedCount: toAssign.length,
      neededCount: needed,
      isPartial: toAssign.length < needed,
      alreadyMet: false,
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
// `createRotaService(token)` lets the rota feature opt into the current live scheduled-session
// feed used by Calendar without touching calendar files. Missing planner endpoints still throw
// explicit errors until the Phase 1A backend contract is completed.

export function createRotaService(token?: string): RotaService {
  if (token) {
    return new ApiRotaService(token)
  }

  return new MockRotaService()
}
