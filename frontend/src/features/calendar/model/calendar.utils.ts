import type {
  CalendarDateRange,
  CalendarDayCell,
  CalendarEvent,
  CalendarWeekDaySchedule,
  CalendarWeekDaySummary,
  CalendarViewMode,
} from './calendar.types'

function startOfDayLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export function startOfWeek(date: Date) {
  const dayStart = startOfDayLocal(date)
  return addDays(dayStart, -dayStart.getDay())
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDateRangeForView(viewMode: CalendarViewMode, focusDate: Date): CalendarDateRange {
  if (viewMode === 'month') {
    return {
      start: startOfMonth(focusDate),
      end: endOfMonth(focusDate),
    }
  }

  if (viewMode === 'week') {
    const weekStart = startOfWeek(focusDate)
    return {
      start: weekStart,
      end: addDays(weekStart, 6),
    }
  }

  return {
    start: startOfDayLocal(focusDate),
    end: startOfDayLocal(focusDate),
  }
}

export function buildCurrentWeekSummary(
  focusDate: Date,
  allEvents: CalendarEvent[],
): CalendarWeekDaySummary[] {
  const weekStart = startOfWeek(focusDate)
  const today = startOfDayLocal(new Date()).getTime()

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    const start = startOfDayLocal(date).getTime()
    const end = addDays(date, 1).getTime()

    const eventCount = allEvents.filter((event) => {
      const startsAt = new Date(event.startsAt).getTime()
      return startsAt >= start && startsAt < end
    }).length

    return {
      isoDate: formatLocalDateKey(date),
      dayLabel: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      isToday: start === today,
      eventCount,
    }
  })
}

function minutesSinceStartOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function applyOverlapLayout(events: Array<{
  event: CalendarEvent
  startMinute: number
  endMinute: number
  durationMinutes: number
}>) {
  const laidOutEvents: CalendarWeekDaySchedule['events'] = []
  let index = 0

  while (index < events.length) {
    const cluster = [events[index]]
    let clusterEnd = events[index].endMinute
    index += 1

    while (index < events.length && events[index].startMinute < clusterEnd) {
      cluster.push(events[index])
      clusterEnd = Math.max(clusterEnd, events[index].endMinute)
      index += 1
    }

    const activeColumns: Array<{ endMinute: number; column: number }> = []
    let maxColumns = 1
    const clusteredEvents = cluster.map((event) => {
      for (let activeIndex = activeColumns.length - 1; activeIndex >= 0; activeIndex -= 1) {
        if (activeColumns[activeIndex].endMinute <= event.startMinute) {
          activeColumns.splice(activeIndex, 1)
        }
      }

      let column = 0
      while (activeColumns.some((active) => active.column === column)) {
        column += 1
      }

      activeColumns.push({ endMinute: event.endMinute, column })
      maxColumns = Math.max(maxColumns, activeColumns.length)

      return {
        ...event,
        overlapIndex: column,
        overlapCount: 1,
      }
    })

    laidOutEvents.push(
      ...clusteredEvents.map((event) => ({
        ...event,
        overlapCount: maxColumns,
      })),
    )
  }

  return laidOutEvents
}

export function buildCurrentWeekSchedule(
  focusDate: Date,
  allEvents: CalendarEvent[],
): CalendarWeekDaySchedule[] {
  const weekStart = startOfWeek(focusDate)
  const today = startOfDayLocal(new Date()).getTime()

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    const dayStart = startOfDayLocal(date)
    const dayStartTime = dayStart.getTime()
    const dayEndTime = addDays(dayStart, 1).getTime()

    const events = applyOverlapLayout(
      allEvents
      .filter((event) => {
        const startsAt = new Date(event.startsAt).getTime()
        return startsAt >= dayStartTime && startsAt < dayEndTime
      })
      .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime())
      .map((event) => {
        const startsAt = new Date(event.startsAt)
        const endsAt = new Date(event.endsAt)
        const startMinute = Math.max(0, minutesSinceStartOfDay(startsAt))
        const rawEndMinute = endsAt.getTime() >= dayEndTime ? 24 * 60 : minutesSinceStartOfDay(endsAt)
        const endMinute = Math.min(24 * 60, Math.max(startMinute + 30, rawEndMinute))

        return {
          event,
          startMinute,
          endMinute,
          durationMinutes: endMinute - startMinute,
        }
      }),
    )

    return {
      isoDate: formatLocalDateKey(date),
      dayLabel: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      isToday: dayStartTime === today,
      events,
    }
  })
}

export function eventsInMonth(events: CalendarEvent[], monthDate: Date) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const monthStartTime = monthStart.getTime()
  const monthEndTime = new Date(
    monthEnd.getFullYear(),
    monthEnd.getMonth(),
    monthEnd.getDate(),
    23,
    59,
    59,
    999,
  ).getTime()

  return events
    .filter((event) => {
      const startTime = new Date(event.startsAt).getTime()
      return startTime >= monthStartTime && startTime <= monthEndTime
    })
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime())
}

export function buildMonthGrid(monthDate: Date, allEvents: CalendarEvent[]) {
  const firstDayOfMonth = startOfMonth(monthDate)
  const monthIndex = firstDayOfMonth.getMonth()
  const monthStartWeekday = firstDayOfMonth.getDay()
  const gridStart = addDays(firstDayOfMonth, -monthStartWeekday)
  const today = startOfDayLocal(new Date()).getTime()

  const dayCells: CalendarDayCell[] = []
  for (let i = 0; i < 42; i += 1) {
    const cellDate = addDays(gridStart, i)
    const cellDateStart = startOfDayLocal(cellDate)
    const cellDateEnd = addDays(cellDateStart, 1).getTime()
    const cellDateTime = cellDateStart.getTime()

    const dayEvents = allEvents.filter((event) => {
      const eventStart = new Date(event.startsAt).getTime()
      return eventStart >= cellDateTime && eventStart < cellDateEnd
    })

    dayCells.push({
      isoDate: formatLocalDateKey(cellDateStart),
      dayOfMonth: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthIndex,
      isToday: cellDateTime === today,
      events: dayEvents,
    })
  }

  return dayCells
}
