import type { ScheduledSession } from '../../model/rota.types'
import { formatDuration, sessionHeightPx, timeToTopPx } from '../../model/rota.utils'

type PlacedSessionCardProps = {
  session: ScheduledSession
  isSelected?: boolean
  onSelect?: (session: ScheduledSession) => void
}

function statusTone(status: ScheduledSession['status']) {
  if (status === 'published' || status === 'completed') return 'confirmed'
  if (status === 'cancelled') return 'staffing-needed'
  return 'planned'
}

function statusLabel(status: ScheduledSession['status']) {
  if (status === 'published') return 'Published'
  if (status === 'completed') return 'Completed'
  if (status === 'cancelled') return 'Cancelled'
  return 'Draft'
}

export function PlacedSessionCard({ session, isSelected, onSelect }: PlacedSessionCardProps) {
  const tone = statusTone(session.status)

  return (
    <button
      type="button"
      className={[
        'placed-session-card',
        `placed-session-card--${tone}`,
        isSelected ? 'is-selected' : '',
      ].filter(Boolean).join(' ')}
      style={{
        top: `${timeToTopPx(session.start_time)}px`,
        height: `${Math.max(sessionHeightPx(session.start_time, session.end_time), 68)}px`,
      }}
      aria-label={`${session.title}, ${session.start_time} to ${session.end_time}, ${session.location}. Click to view staffing.`}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => onSelect?.(session)}
    >
      <div className="placed-session-card__topline">
        <span className={`status-badge status-badge--${tone}`}>{statusLabel(session.status)}</span>
        <span className="placed-session-card__time">
          {session.start_time} - {session.end_time}
        </span>
      </div>

      <h5>{session.title}</h5>
      <p>{session.location}</p>

      <div className="placed-session-card__meta">
        <span>{formatDuration(session.start_time, session.end_time)}</span>
        <span>
          {session.min_staff}
          {session.max_staff ? `-${session.max_staff}` : '+'} staff
        </span>
      </div>
    </button>
  )
}
