// ─── Domain types ────────────────────────────────────────────────────────────
// Field names and enum values mirror the SQLite schema in backend/src/db/migrate.ts
// so that swapping MockRotaService → ApiRotaService requires zero type changes.

export type ContractType = 'salaried' | 'sessional'
export type SessionStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type AssignmentStatus = 'proposed' | 'confirmed' | 'declined' | 'cancelled'
export type AvailabilityType = 'holiday' | 'sickness' | 'other_absence' | 'unavailable'

export interface Skill {
  id: string
  name: string
}

export interface Session {
  id: string
  programme_id: string | null
  title: string
  description: string | null
  /** ISO date string (YYYY-MM-DD). Null when the session is unscheduled. */
  session_date: string | null
  /** 24-hour HH:MM. Null when unscheduled. */
  start_time: string | null
  /** 24-hour HH:MM. Null when unscheduled. */
  end_time: string | null
  location: string
  status: SessionStatus
  min_staff: number
  max_staff: number
  session_type: string | null
  notes: string | null
  /** Skills required for this session (from session_skill_requirements join) */
  required_skills: Skill[]
}

export interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  contract_type: ContractType | null
  contracted_hours_per_week: number | null
  skills: Skill[]
  is_active: boolean
}

export interface Assignment {
  id: string
  session_id: string
  staff_id: string
  status: AssignmentStatus
}

export interface AvailabilityRecord {
  id: string
  staff_id: string
  type: AvailabilityType
  /** ISO date string (YYYY-MM-DD) */
  start_date: string
  /** ISO date string (YYYY-MM-DD) */
  end_date: string
}

// ─── View-layer helpers ───────────────────────────────────────────────────────

/** A session that has been placed onto the week grid */
export interface ScheduledSession extends Session {
  session_date: string  // non-null when scheduled
  start_time: string
  end_time: string
  /** Live week feeds can include the currently assigned staff count for queue display. */
  assigned_staff_count?: number
}

/** Assignment enriched with the full StaffMember for display */
export interface AssignmentWithStaff extends Assignment {
  staff: StaffMember
}

/** A week expressed as its Monday ISO date string */
export type WeekStart = string  // ISO date, always a Monday

/** Business-rule check result attached per assignment in the modal */
export interface AssignmentWarning {
  type: 'double_booking' | 'skill_gap' | 'over_allocation'
  message: string
  severity: 'error' | 'warning'
}
