export function CalendarLegend() {
  return (
    <section className="calendar-legend" aria-label="Calendar event status legend">
      <h3>Event status legend</h3>
      <ul>
        <li>
          <span className="status-badge status-badge--confirmed" aria-hidden="true">
            ✓ Confirmed
          </span>
          <span>Session is staffed and scheduled.</span>
        </li>
        <li>
          <span className="status-badge status-badge--planned" aria-hidden="true">
            ○ Planned
          </span>
          <span>Session is drafted and awaiting final checks.</span>
        </li>
        <li>
          <span className="status-badge status-badge--staffing-needed" aria-hidden="true">
            ! Staffing Needed
          </span>
          <span>Session requires rota attention before delivery.</span>
        </li>
      </ul>
    </section>
  )
}
