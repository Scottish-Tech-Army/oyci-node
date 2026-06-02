import type { ScheduledSession } from '../../model/rota.types'
import { StaffingQueueItem } from './StaffingQueueItem'

type StaffingQueueProps = {
  sessions: ScheduledSession[]
  selectedSessionId: string | null
  onSelectSession: (session: ScheduledSession) => void
}

function getAssignedCount(session: ScheduledSession): number {
  if (typeof session.assigned_staff_count === 'number') return session.assigned_staff_count

  // Mock sessions do not carry a live assignment count, so keep the legacy fallback.
  return session.status === 'published' || session.status === 'completed' ? 1 : 0
}

export function StaffingQueue({ sessions, selectedSessionId, onSelectSession }: StaffingQueueProps) {
  const understaffed = sessions.filter((s) => {
    const assigned = getAssignedCount(s)
    return assigned < s.min_staff
  })

  return (
    <aside className="staffing-queue" aria-label="Sessions needing staff this week">
      <div className="staffing-queue__header">
        <h4>Needs staff</h4>
        <span className="staffing-queue__count" aria-label={`${understaffed.length} sessions need staff`}>
          {understaffed.length}
        </span>
      </div>

      {understaffed.length === 0 ? (
        <div className="staffing-queue__empty">
          <p>All sessions in this week meet their minimum staffing requirement.</p>
        </div>
      ) : (
        <ul className="staffing-queue__list">
          {understaffed.map((session) => (
            <li key={session.id}>
              <StaffingQueueItem
                session={session}
                assignedCount={getAssignedCount(session)}
                isSelected={selectedSessionId === session.id}
                onSelect={onSelectSession}
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
