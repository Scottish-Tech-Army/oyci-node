import type { ScheduledSession } from '../../model/rota.types'
import { formatDuration } from '../../model/rota.utils'

type StaffingQueueItemProps = {
  session: ScheduledSession
  assignedCount: number
  isSelected: boolean
  onSelect: (session: ScheduledSession) => void
}

function staffingGapLabel(assigned: number, minStaff: number): string {
  const gap = minStaff - assigned
  if (gap <= 0) return 'Fully staffed'
  return `${gap} more needed`
}

export function StaffingQueueItem({ session, assignedCount, isSelected, onSelect }: StaffingQueueItemProps) {
  const gap = session.min_staff - assignedCount

  return (
    <button
      type="button"
      className={[
        'staffing-queue-item',
        isSelected ? 'is-selected' : '',
        gap > 0 ? 'has-gap' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onSelect(session)}
      aria-label={`${session.title}, ${session.start_time} to ${session.end_time}, ${staffingGapLabel(assignedCount, session.min_staff)}`}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="staffing-queue-item__header">
        <span className="staffing-queue-item__time">
          {session.start_time} – {session.end_time}
        </span>
        <span className="staffing-queue-item__duration">
          {formatDuration(session.start_time, session.end_time)}
        </span>
      </div>

      <h5 className="staffing-queue-item__title">{session.title}</h5>
      <p className="staffing-queue-item__location">{session.location}</p>

      <div className="staffing-queue-item__staffing">
        <span className={gap > 0 ? 'staffing-queue-item__badge is-understaffed' : 'staffing-queue-item__badge is-ok'}>
          {assignedCount} / {session.min_staff} staff
        </span>
        {gap > 0 ? (
          <span className="staffing-queue-item__gap-label">
            {staffingGapLabel(assignedCount, session.min_staff)}
          </span>
        ) : null}
      </div>
    </button>
  )
}
