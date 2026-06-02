type CalendarToolbarProps = {
  monthTitle: string
  onPreviousMonth: () => void
  onNextMonth: () => void
  onResetToCurrentMonth: () => void
}

export function CalendarToolbar({
  monthTitle,
  onPreviousMonth,
  onNextMonth,
  onResetToCurrentMonth,
}: CalendarToolbarProps) {
  return (
    <header className="calendar-toolbar" aria-label="Calendar controls">
      <div className="calendar-toolbar__month-nav">
        <button type="button" className="calendar-toolbar__nav-button" onClick={onPreviousMonth} aria-label="Show previous month">
          ← Previous
        </button>
        <h3 className="calendar-toolbar__month-title">{monthTitle}</h3>
        <button type="button" className="calendar-toolbar__nav-button" onClick={onNextMonth} aria-label="Show next month">
          Next →
        </button>
        <button type="button" className="calendar-toolbar__today" onClick={onResetToCurrentMonth}>
          Today
        </button>
      </div>

      <ul className="calendar-toolbar__legend" aria-label="Event status legend">
        <li>
          <span
            className="status-badge status-badge--confirmed"
            title="Session is staffed and scheduled"
          >
            ✓ Confirmed
          </span>
        </li>
        <li>
          <span
            className="status-badge status-badge--planned"
            title="Session is drafted and awaiting final checks"
          >
            ○ Planned
          </span>
        </li>
        <li>
          <span
            className="status-badge status-badge--staffing-needed"
            title="Session requires rota attention before delivery"
          >
            ! Staffing Needed
          </span>
        </li>
      </ul>
    </header>
  )
}
