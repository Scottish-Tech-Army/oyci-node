import { useEffect, useRef } from 'react'
import type { CalendarEvent } from '../model/calendar.types'

type EventDetailsModalProps = {
  event: CalendarEvent
  onClose: () => void
}

function statusLabel(status: CalendarEvent['status']) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'staffing-needed') return 'Staffing Needed'
  return 'Planned'
}

function formatDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="event-modal-title">{event.title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close event details"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          <dl className="modal-details">
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`status-badge status-badge--${event.status}`}>
                  {statusLabel(event.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Starts</dt>
              <dd>{formatDateTime(event.startsAt)}</dd>
            </div>
            <div>
              <dt>Ends</dt>
              <dd>{formatDateTime(event.endsAt)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{event.location ?? <span className="modal-empty">Not specified</span>}</dd>
            </div>
            <div>
              <dt>Staff</dt>
              <dd>
                {event.staffAssigned.length > 0 ? (
                  <ul className="modal-staff-list">
                    {event.staffAssigned.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="modal-empty modal-empty--warning">No staff assigned yet</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Attendees</dt>
              <dd>
                {event.attendeeCount !== null
                  ? event.attendeeCount
                  : <span className="modal-empty">Not yet recorded</span>}
              </dd>
            </div>
            {event.notes && (
              <div className="modal-details__notes">
                <dt>Notes</dt>
                <dd>{event.notes}</dd>
              </div>
            )}
            <div>
              <dt>Session ID</dt>
              <dd><code className="modal-session-id">{event.id}</code></dd>
            </div>
          </dl>
        </div>

        <footer className="modal-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
