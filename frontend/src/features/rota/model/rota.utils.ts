/**
 * rota.utils.ts — Time and grid positioning helpers
 *
 * All helpers are pure functions with no side-effects so they are easily
 * unit-testable and reusable across WeekView, RotaToolbar, and the modal.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const GRID_START_HOUR = 0        // 00:00
export const GRID_END_HOUR = 24         // 24:00
export const BUSINESS_HOUR_START = 8    // 08:00
export const BUSINESS_HOUR_END = 18     // 18:00
export const INITIAL_FOCUS_HOUR = BUSINESS_HOUR_START
export const SLOT_MINUTES = 30          // each drop-target slot
export const SLOT_HEIGHT_PX = 48        // pixel height of each 30-min row

export const TOTAL_SLOTS = ((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES
export const GRID_HEIGHT_PX = TOTAL_SLOTS * SLOT_HEIGHT_PX  // 2304px for 00:00–24:00
export const BUSINESS_HOUR_START_SLOT = ((BUSINESS_HOUR_START - GRID_START_HOUR) * 60) / SLOT_MINUTES
export const BUSINESS_HOUR_END_SLOT = ((BUSINESS_HOUR_END - GRID_START_HOUR) * 60) / SLOT_MINUTES

export function isBusinessHourSlot(index: number): boolean {
  return index >= BUSINESS_HOUR_START_SLOT && index < BUSINESS_HOUR_END_SLOT
}

// ─── Time parsing ─────────────────────────────────────────────────────────────

/** Convert "HH:MM" → total minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Convert total minutes since midnight → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Duration in minutes between two HH:MM strings */
export function sessionDurationMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

/** Human-readable duration, e.g. "2 hrs 30 min" or "1 hr" */
export function formatDuration(startTime: string, endTime: string): string {
  const mins = sessionDurationMinutes(startTime, endTime)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`
  return `${h} hr${h > 1 ? 's' : ''} ${m} min`
}

// ─── Grid positioning ─────────────────────────────────────────────────────────

/** px offset from the top of the grid for a given time string */
export function timeToTopPx(time: string): number {
  const mins = timeToMinutes(time) - GRID_START_HOUR * 60
  return (mins / SLOT_MINUTES) * SLOT_HEIGHT_PX
}

/** px height for a session spanning startTime → endTime */
export function sessionHeightPx(startTime: string, endTime: string): number {
  return (sessionDurationMinutes(startTime, endTime) / SLOT_MINUTES) * SLOT_HEIGHT_PX
}

/**
 * Given a raw Y pixel offset from the top of the grid (e.g. from a drop event),
 * snap it to the nearest 30-min boundary and return the HH:MM start time.
 */
export function snapYToTime(yPx: number): string {
  const slotIndex = Math.round(yPx / SLOT_HEIGHT_PX)
  const clampedSlot = Math.max(0, Math.min(slotIndex, TOTAL_SLOTS - 1))
  const minutesSinceGridStart = clampedSlot * SLOT_MINUTES
  return minutesToTime(GRID_START_HOUR * 60 + minutesSinceGridStart)
}

/** Slot index (0-based) for a given time string — used to map drop targets */
export function timeToSlotIndex(time: string): number {
  const mins = timeToMinutes(time) - GRID_START_HOUR * 60
  return Math.floor(mins / SLOT_MINUTES)
}

/** Return the HH:MM start time for a given slot index */
export function slotIndexToTime(index: number): string {
  return minutesToTime(GRID_START_HOUR * 60 + index * SLOT_MINUTES)
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Get the ISO date string of the Monday for a given Date */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns 7 Date objects Mon–Sun for the week containing `weekStart` */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

/** Short label: "Mon 7" */
export function formatDayShort(date: Date): string {
  return `${DAY_LABELS[getWeekdayIndex(date)]} ${date.getDate()}`
}

/** Full label: "Monday 7 Jul" */
export function formatDayFull(date: Date): string {
  return `${DAY_FULL_LABELS[getWeekdayIndex(date)]} ${date.getDate()} ${date.toLocaleString('en-GB', { month: 'short' })}`
}

/** 0=Mon … 6=Sun index for a Date */
export function getWeekdayIndex(date: Date): number {
  const d = date.getDay() // 0=Sun
  return d === 0 ? 6 : d - 1
}

/** ISO date string YYYY-MM-DD for a Date */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Return the calendar weeks in a given month as an array of Monday Dates.
 * "Week 1" is the week containing the 1st of the month.
 */
export function getWeeksInMonth(year: number, month: number): Date[] {
  // month is 0-based (JS convention)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const weeks: Date[] = []
  let current = getMondayOfWeek(firstDay)

  while (current <= lastDay) {
    weeks.push(new Date(current))
    current = new Date(current)
    current.setDate(current.getDate() + 7)
  }

  return weeks
}

/** Format week label: "Week 1 (Jul 7 – Jul 13)" */
export function formatWeekLabel(weekIndex: number, monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleString('en-GB', { month: 'short', day: 'numeric' })
  return `Week ${weekIndex + 1} (${fmt(monday)} – ${fmt(sunday)})`
}

// ─── Availability helpers ─────────────────────────────────────────────────────

/** Returns true if the ISO date falls within the record's range (inclusive) */
export function isDateInRange(isoDate: string, startDate: string, endDate: string): boolean {
  return isoDate >= startDate && isoDate <= endDate
}

/** Returns true if two time ranges overlap (same-day check) */
export function timesOverlap(
  start1: string, end1: string,
  start2: string, end2: string,
): boolean {
  return timeToMinutes(start1) < timeToMinutes(end2) &&
         timeToMinutes(end1) > timeToMinutes(start2)
}
