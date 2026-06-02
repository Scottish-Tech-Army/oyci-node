import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { CalendarEvent, CalendarWeekDaySchedule } from '../model/calendar.types'

type ExpandedWeekViewProps = {
  days: CalendarWeekDaySchedule[]
  onEventSelect: (event: CalendarEvent) => void
  onCollapse: () => void
}

function matchesStaffFilter(event: CalendarEvent, filter: string): boolean {
  const q = filter.trim().toLowerCase()
  if (q === '') return true
  return event.staffAssigned.some((s) => s.toLowerCase().includes(q))
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${`${hour}`.padStart(2, '0')}:00`)
const PIXELS_PER_HOUR = 52
const TRACK_HEIGHT = HOUR_LABELS.length * PIXELS_PER_HOUR
const BUSINESS_HOUR_START = 9
const BUSINESS_HOUR_END = 18

type ExpandedWeekEventStyle = CSSProperties & {
  '--overlap-count': string
  '--overlap-index': string
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const formatTime = (isoDate: string) =>
    new Date(isoDate).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return `${formatTime(startsAt)} - ${formatTime(endsAt)}`
}

function statusLabel(status: CalendarEvent['status']) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'staffing-needed') return 'Staffing Needed'
  return 'Planned'
}

export function ExpandedWeekView({ days, onEventSelect, onCollapse }: ExpandedWeekViewProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [staffFilter, setStaffFilter] = useState('')

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const currentMinute = currentTime.getHours() * 60 + currentTime.getMinutes()

  const hourSlots = useMemo(
    () =>
      HOUR_LABELS.map((label, index) => ({
        label,
        isBusinessHour: index >= BUSINESS_HOUR_START && index < BUSINESS_HOUR_END,
      })),
    [],
  )

  const isFilterActive = staffFilter.trim() !== ''

  const filteredDays = useMemo(() => {
    if (!isFilterActive) return days
    return days.map((day) => ({
      ...day,
      events: day.events.filter(({ event }) => matchesStaffFilter(event, staffFilter)),
    }))
  }, [days, staffFilter, isFilterActive])

  return (
    <section id="expanded-week-view" className="expanded-week-view" aria-label="Expanded current week schedule">
      <div className="expanded-week-view__intro">
        <div className="expanded-week-view__intro-copy">
          <h3>Hourly week view</h3>
          <p>Expanded schedule for the current week, showing the full day with business hours highlighted from 09:00 to 18:00.</p>
        </div>

        <button
          type="button"
          className="expanded-week-view__toggle"
          onClick={onCollapse}
          aria-expanded="true"
          aria-controls="expanded-week-view"
        >
          Collapse week view
        </button>
      </div>

      <div className="expanded-week-view__filter-row">
        <label htmlFor="staff-filter" className="expanded-week-view__filter-label">
          Filter by staff
        </label>
        <input
          id="staff-filter"
          type="search"
          className="expanded-week-view__filter-input"
          placeholder="Name or email…"
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          aria-describedby="staff-filter-hint"
        />
        <span id="staff-filter-hint" className="expanded-week-view__filter-hint">
          {isFilterActive
            ? 'Showing only sessions with matching assigned staff. Unassigned sessions are hidden.'
            : 'Enter a name or email to show only matching sessions.'}
        </span>
      </div>

      <div className="expanded-week-view__viewport">
        <div className="expanded-week-view__header">
          <div className="expanded-week-view__corner">Time</div>
          {filteredDays.map((day) => (
            <div
              key={day.isoDate}
              className={`expanded-week-view__day-header${day.isToday ? ' is-today' : ''}`}
            >
              <p>{day.dayLabel}</p>
              <p>{day.dateLabel}</p>
            </div>
          ))}
        </div>

        <div className="expanded-week-view__scroll">
          <div className="expanded-week-view__times" aria-hidden="true">
            {hourSlots.map(({ label, isBusinessHour }) => (
              <div
                key={label}
                className={`expanded-week-view__time-label${isBusinessHour ? ' is-business-hour' : ''}`}
              >
                {label}
              </div>
            ))}
          </div>

          {filteredDays.map((day) => (
            <div
              key={day.isoDate}
              className={`expanded-week-view__track${day.isToday ? ' is-today' : ''}`}
              style={{ height: `${TRACK_HEIGHT}px` }}
            >
              {hourSlots.map(({ label, isBusinessHour }) => (
                <div
                  key={`${day.isoDate}-${label}`}
                  className={`expanded-week-view__hour-slot${isBusinessHour ? ' is-business-hour' : ''}`}
                  aria-hidden="true"
                />
              ))}

              {day.isToday ? (
                <div
                  className="expanded-week-view__now-line"
                  style={{ top: `${(currentMinute / 60) * PIXELS_PER_HOUR}px` }}
                  aria-hidden="true"
                >
                  <span className="expanded-week-view__now-dot" />
                </div>
              ) : null}

              {day.events.map(({ event, startMinute, durationMinutes, overlapCount, overlapIndex }) => {
                const eventStyle: ExpandedWeekEventStyle = {
                  top: `${(startMinute / 60) * PIXELS_PER_HOUR}px`,
                  height: `${Math.max((durationMinutes / 60) * PIXELS_PER_HOUR, 40)}px`,
                  '--overlap-count': `${overlapCount}`,
                  '--overlap-index': `${overlapIndex}`,
                }

                const staffList =
                  event.staffAssigned.length > 0 ? event.staffAssigned.join(', ') : 'No staff assigned'

                return (
                  <button
                    key={event.id}
                    type="button"
                    className={`expanded-week-view__event expanded-week-view__event--${event.status}`}
                    style={eventStyle}
                    onClick={() => onEventSelect(event)}
                    aria-label={`${event.title}, ${statusLabel(event.status)}, ${formatTimeRange(event.startsAt, event.endsAt)}, ${event.location}, ${staffList}`}
                  >
                    <span className="expanded-week-view__event-time">
                      {formatTimeRange(event.startsAt, event.endsAt)}
                    </span>
                    <span className="expanded-week-view__event-title">{event.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
