import type { CalendarWeekDaySummary } from '../model/calendar.types'

type CurrentWeekStripProps = {
  days: CalendarWeekDaySummary[]
  isExpanded: boolean
  onToggle: () => void
}

export function CurrentWeekStrip({ days, isExpanded, onToggle }: CurrentWeekStripProps) {
  return (
    <section className="current-week-strip" aria-label="Current week summary">
      <div className="current-week-strip__header">
        <div className="current-week-strip__header-copy">
          <h3>This week</h3>
          <p>Quick view of day-by-day event volume for operational planning.</p>
        </div>

        <button
          type="button"
          className="current-week-strip__toggle"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls="expanded-week-view"
        >
          {isExpanded ? 'Collapse week view' : 'Expand week view'}
        </button>
      </div>

      <ol className="current-week-strip__days">
        {days.map((day) => (
          <li key={day.isoDate} className={day.isToday ? 'is-today' : undefined}>
            <p className="current-week-strip__day">{day.dayLabel}</p>
            <p className="current-week-strip__date">{day.dateLabel}</p>
            <p className="current-week-strip__count">
              <span aria-hidden="true">Events:</span> {day.eventCount}
            </p>
            {day.isToday ? <p className="current-week-strip__today">Today</p> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
