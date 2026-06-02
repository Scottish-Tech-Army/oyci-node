import { useMemo, useState } from 'react'
import type { CalendarDayCell, CalendarEvent } from '../model/calendar.types'

type MonthGridProps = {
  dayCells: CalendarDayCell[]
  onEventSelect: (event: CalendarEvent) => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENTS_PER_PAGE = 2

function statusLabel(status: CalendarDayCell['events'][number]['status']) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'staffing-needed') return 'Staffing Needed'
  return 'Planned'
}

function formatDayLabel(isoDate: string) {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function chunkEvents(events: CalendarEvent[]) {
  const pages: CalendarEvent[][] = []

  for (let index = 0; index < events.length; index += EVENTS_PER_PAGE) {
    pages.push(events.slice(index, index + EVENTS_PER_PAGE))
  }

  return pages
}

type MonthGridDayProps = {
  day: CalendarDayCell
  onEventSelect: (event: CalendarEvent) => void
}

function MonthGridDay({ day, onEventSelect }: MonthGridDayProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const eventPages = useMemo(() => chunkEvents(day.events), [day.events])
  const totalPages = eventPages.length
  const hasMultiplePages = totalPages > 1
  const dayLabel = formatDayLabel(day.isoDate)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages - 1, 0))

  return (
    <li
      className={[
        'month-grid__day',
        day.inCurrentMonth ? '' : 'is-outside-month',
        day.isToday ? 'is-today' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="month-grid__day-header">
        <p className="month-grid__day-number">
          <span className="sr-only">{dayLabel}</span>
          {day.dayOfMonth}
        </p>

        {hasMultiplePages ? (
          <div className="month-grid__day-controls" aria-label={`Event pages for ${dayLabel}`}>
            <button
              type="button"
              className="month-grid__day-nav"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
              disabled={safeCurrentPage === 0}
              aria-label={`Show previous events for ${dayLabel}`}
            >
              ‹
            </button>
            <span className="month-grid__page-indicator" aria-live="polite">
              {safeCurrentPage + 1}/{totalPages}
            </span>
            <button
              type="button"
              className="month-grid__day-nav"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages - 1))}
              disabled={safeCurrentPage === totalPages - 1}
              aria-label={`Show next events for ${dayLabel}`}
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      {totalPages > 0 ? (
        <div className="month-grid__events-carousel">
          <div className="month-grid__events-viewport">
            <div
              className="month-grid__events-track"
              style={{ transform: `translateX(-${safeCurrentPage * 100}%)` }}
            >
              {eventPages.map((eventsPage, pageIndex) => (
                <ul
                  key={`${day.isoDate}-${pageIndex}`}
                  className="month-grid__events-page"
                  aria-hidden={pageIndex !== safeCurrentPage}
                >
                  {eventsPage.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        className="event-button"
                        onClick={() => onEventSelect(event)}
                      >
                        <span className={`status-badge status-badge--${event.status}`}>{statusLabel(event.status)}</span>
                        <span>{event.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function MonthGrid({ dayCells, onEventSelect }: MonthGridProps) {
  return (
    <section className="month-grid" aria-label="Monthly calendar">
      <div className="month-grid__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <ol className="month-grid__cells">
        {dayCells.map((day) => (
          <MonthGridDay key={day.isoDate} day={day} onEventSelect={onEventSelect} />
        ))}
      </ol>
    </section>
  )
}
