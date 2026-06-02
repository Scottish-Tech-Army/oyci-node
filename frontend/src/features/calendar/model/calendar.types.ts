export type CalendarViewMode = 'month' | 'week' | 'day'

export type CalendarEventStatus = 'confirmed' | 'planned' | 'staffing-needed'

export type CalendarEvent = {
  id: string
  title: string
  startsAt: string
  endsAt: string
  location: string
  status: CalendarEventStatus
  staffAssigned: string[]
  attendeeCount: number | null
  notes: string | null
}

export type CalendarDayCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

export type CalendarDateRange = {
  start: Date
  end: Date
}

export type CalendarWeekDaySummary = {
  isoDate: string
  dayLabel: string
  dateLabel: string
  isToday: boolean
  eventCount: number
}

export type CalendarWeekScheduledEvent = {
  event: CalendarEvent
  startMinute: number
  endMinute: number
  durationMinutes: number
  overlapIndex: number
  overlapCount: number
}

export type CalendarWeekDaySchedule = {
  isoDate: string
  dayLabel: string
  dateLabel: string
  isToday: boolean
  events: CalendarWeekScheduledEvent[]
}
