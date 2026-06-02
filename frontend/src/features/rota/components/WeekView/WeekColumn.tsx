import type { ScheduledSession } from '../../model/rota.types'
import { TOTAL_SLOTS, toISODate } from '../../model/rota.utils'
import { PlacedSessionCard } from './PlacedSessionCard'
import { TimeSlot } from './TimeSlot'

type WeekColumnProps = {
  day: Date
  sessions: ScheduledSession[]
  gridHeightPx: number
  isLoading: boolean
  selectedSessionId: string | null
  onSelectSession: (session: ScheduledSession) => void
}

export function WeekColumn({ day, sessions, gridHeightPx, isLoading, selectedSessionId, onSelectSession }: WeekColumnProps) {
  const isoDate = toISODate(day)
  const daySessions = sessions.filter((session) => session.session_date === isoDate)
  const isToday = toISODate(new Date()) === isoDate

  return (
    <div className={isToday ? 'rota-week-column is-today' : 'rota-week-column'} style={{ height: `${gridHeightPx}px` }}>
      {Array.from({ length: TOTAL_SLOTS }, (_, index) => (
        <TimeSlot key={`${isoDate}-${index}`} index={index} />
      ))}

      {daySessions.map((session) => (
        <PlacedSessionCard
          key={session.id}
          session={session}
          isSelected={selectedSessionId === session.id}
          onSelect={onSelectSession}
        />
      ))}

      {!isLoading && daySessions.length === 0 ? (
        <div className="rota-week-column__empty" aria-hidden="true">
          <span>No sessions</span>
        </div>
      ) : null}
    </div>
  )
}
