type WeekOption = {
  value: number
  label: string
}

type RotaToolbarProps = {
  selectedMonth: number
  selectedYear: number
  yearOptions: number[]
  weekOptions: WeekOption[]
  selectedWeekIndex: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onWeekSelect: (weekIndex: number) => void
  onReturnToCurrentWeek: () => void
}

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function RotaToolbar({
  selectedMonth,
  selectedYear,
  yearOptions,
  weekOptions,
  selectedWeekIndex,
  onMonthChange,
  onYearChange,
  onWeekSelect,
  onReturnToCurrentWeek,
}: RotaToolbarProps) {
  return (
    <header className="rota-toolbar" aria-label="Rota planner controls">
      <div className="rota-toolbar__primary">
        <div className="rota-toolbar__selectors">
          <label className="rota-toolbar__field">
            <span>Month</span>
            <select
              value={selectedMonth}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              aria-label="Select month"
            >
              {MONTH_OPTIONS.map((monthLabel, index) => (
                <option key={monthLabel} value={index}>
                  {monthLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="rota-toolbar__field">
            <span>Year</span>
            <select
              value={selectedYear}
              onChange={(event) => onYearChange(Number(event.target.value))}
              aria-label="Select year"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="rota-toolbar__reset" onClick={onReturnToCurrentWeek}>
          Return to current week
        </button>
      </div>

      <div className="rota-toolbar__weeks" role="group" aria-label="Select week of month">
        {weekOptions.map((week) => {
          const isSelected = week.value === selectedWeekIndex
          return (
            <button
              key={week.value}
              type="button"
              className={isSelected ? 'rota-toolbar__week-chip is-selected' : 'rota-toolbar__week-chip'}
              onClick={() => onWeekSelect(week.value)}
              aria-pressed={isSelected}
            >
              {week.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
