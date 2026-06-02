import { useEffect, useMemo, useState } from 'react'
import { CalendarToolbar } from '../components/CalendarToolbar'
import { CurrentWeekStrip } from '../components/CurrentWeekStrip'
import { ExpandedWeekView } from '../components/ExpandedWeekView'
import { EventDetailsModal } from '../components/EventDetailsModal'
import { MonthEventList } from '../components/MonthEventList'
import { MonthGrid } from '../components/MonthGrid'
import type { CalendarEvent } from '../model/calendar.types'
import { sessionsAPI } from '../../../services/api'
import { useAuth } from '../../../services/auth.context'
import {
  buildCurrentWeekSchedule,
  buildMonthGrid,
  buildCurrentWeekSummary,
  eventsInMonth,
  formatMonthTitle,
  shiftMonth,
} from '../model/calendar.utils'

type SessionApiRow = {
  id: string
  title: string
  start_time: string
  end_time: string
  location: string | null
  notes: string | null
  attendees: number | null
  session_type: 'standard' | 'mentoring' | 'workshop' | 'outreach' | string
  staffAssigned?: string[]
}

function toCalendarEvent(session: SessionApiRow): CalendarEvent {
  const staffAssigned = session.staffAssigned ?? []
  const status: CalendarEvent['status'] =
    staffAssigned.length > 0
      ? 'confirmed'
      : session.session_type === 'standard'
        ? 'planned'
        : 'staffing-needed'

  return {
    id: session.id,
    title: session.title,
    startsAt: session.start_time,
    endsAt: session.end_time,
    location: session.location ?? 'Unspecified',
    status,
    staffAssigned,
    attendeeCount: session.attendees,
    notes: session.notes,
  }
}

export function CalendarPage() {
  const { token } = useAuth()
  const [activeMonth, setActiveMonth] = useState(() => new Date())
  const [isWeekExpanded, setIsWeekExpanded] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    const loadEvents = async () => {
      if (!token) {
        setEvents([])
        return
      }

      try {
        const response = await sessionsAPI.list(token)
        const sessionRows = (response.data ?? []) as SessionApiRow[]
        setEvents(sessionRows.map(toCalendarEvent))
      } catch {
        setEvents([])
      }
    }

    void loadEvents()
  }, [token])

  const monthTitle = useMemo(() => formatMonthTitle(activeMonth), [activeMonth])
  const monthEvents = useMemo(() => eventsInMonth(events, activeMonth), [events, activeMonth])
  const dayCells = useMemo(() => buildMonthGrid(activeMonth, monthEvents), [activeMonth, monthEvents])
  const currentWeek = useMemo(() => buildCurrentWeekSummary(new Date(), events), [events])
  const currentWeekSchedule = useMemo(() => buildCurrentWeekSchedule(new Date(), events), [events])

  return (
    <section aria-label="Calendar">
      <CalendarToolbar
        monthTitle={monthTitle}
        onPreviousMonth={() => setActiveMonth((current) => shiftMonth(current, -1))}
        onNextMonth={() => setActiveMonth((current) => shiftMonth(current, 1))}
        onResetToCurrentMonth={() => setActiveMonth(new Date())}
      />

      {isWeekExpanded ? (
        <ExpandedWeekView
          days={currentWeekSchedule}
          onEventSelect={setSelectedEvent}
          onCollapse={() => setIsWeekExpanded(false)}
        />
      ) : (
        <CurrentWeekStrip
          days={currentWeek}
          isExpanded={isWeekExpanded}
          onToggle={() => setIsWeekExpanded(true)}
        />
      )}

      <div className="calendar-main">
        <MonthEventList
          events={monthEvents}
          eventCount={monthEvents.length}
          monthLabel={monthTitle}
          onEventSelect={setSelectedEvent}
        />
        <MonthGrid dayCells={dayCells} onEventSelect={setSelectedEvent} />
      </div>

      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </section>
  )
}
