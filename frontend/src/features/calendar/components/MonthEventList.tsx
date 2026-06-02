import type { CalendarEvent } from '../model/calendar.types'

type MonthEventListProps = {
  events: CalendarEvent[]
  eventCount: number
  monthLabel: string
  onEventSelect: (event: CalendarEvent) => void
}

function formatEventDateTime(isoDate: string) {
  const date = new Date(isoDate)
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: CalendarEvent['status']) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'staffing-needed') return 'Staffing Needed'
  return 'Planned'
}

export function MonthEventList({ events, eventCount, monthLabel, onEventSelect }: MonthEventListProps) {
  return (
    <section className="calendar-event-list" aria-live="polite">
      <div className="calendar-event-list__header">
        <h3>{`Events in ${monthLabel}`}</h3>
        <span className="calendar-event-list__count" aria-label={`${eventCount} events in ${monthLabel}`}>
          {eventCount}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="calendar-event-list__empty">{`No events scheduled for ${monthLabel}.`}</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className="calendar-event-list__item-button"
                onClick={() => onEventSelect(event)}
                aria-label={`${event.title}, ${formatEventDateTime(event.startsAt)}, ${event.location}`}
              >
                <div>
                  <strong>{event.title}</strong>
                  <p>{formatEventDateTime(event.startsAt)}</p>
                  <p>{event.location}</p>
                </div>
                <p>
                  <span className={`status-badge status-badge--${event.status}`}>{statusLabel(event.status)}</span>
                  {event.staffAssigned.length > 0 && (
                    <span> · {event.staffAssigned.length} staff assigned</span>
                  )}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
