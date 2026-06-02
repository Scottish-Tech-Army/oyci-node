import { useEffect, useRef } from 'react'
import type { ScheduledSession } from '../../model/rota.types'
import {
  GRID_START_HOUR,
  BUSINESS_HOUR_END,
  BUSINESS_HOUR_START,
  GRID_HEIGHT_PX,
  INITIAL_FOCUS_HOUR,
  SLOT_HEIGHT_PX,
  SLOT_MINUTES,
  TOTAL_SLOTS,
  formatDayShort,
  getWeekDays,
  isBusinessHourSlot,
  slotIndexToTime,
} from '../../model/rota.utils'
import { WeekColumn } from './WeekColumn'

type WeekViewProps = {
  weekStart: Date
  sessions: ScheduledSession[]
  isLoading: boolean
  selectedSessionId: string | null
  onSelectSession: (session: ScheduledSession) => void
}

function buildTimeSlots() {
  return Array.from({ length: TOTAL_SLOTS }, (_, index) => ({
    index,
    label: slotIndexToTime(index),
    isHourStart: (index * SLOT_MINUTES) % 60 === 0,
    isBusinessHour: isBusinessHourSlot(index),
  }))
}

export function WeekView({ weekStart, sessions, isLoading, selectedSessionId, onSelectSession }: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const days = getWeekDays(weekStart)
  const timeSlots = buildTimeSlots()

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    const focusSlots = ((INITIAL_FOCUS_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES
    container.scrollTop = Math.max(0, focusSlots * SLOT_HEIGHT_PX)
  }, [weekStart])

  return (
    <section className="rota-week-view" aria-label="Weekly rota schedule">
      <div className="rota-week-view__intro">
        <div>
          <h4>Weekly time grid</h4>
          <p>
            A 30-minute planning canvas across the full day, with the page opening focused on core
            business hours from {String(BUSINESS_HOUR_START).padStart(2, '0')}:00 -{' '}
            {String(BUSINESS_HOUR_END).padStart(2, '0')}:00.
          </p>
        </div>
        <span className="rota-week-view__legend">30-minute slots</span>
      </div>

      <div className="rota-week-view__viewport">
        <div className="rota-week-view__header">
          <div className="rota-week-view__corner">Time</div>
          {days.map((day) => (
            <div key={day.toDateString()} className="rota-week-view__day-header">
              {formatDayShort(day)}
            </div>
          ))}
        </div>

        <div ref={scrollContainerRef} className="rota-week-view__scroll">
          <div
            className="rota-week-view__times"
            aria-hidden="true"
            style={{ gridTemplateRows: `repeat(${TOTAL_SLOTS}, ${SLOT_HEIGHT_PX}px)` }}
          >
            {timeSlots.map((slot) => (
              <div
                key={slot.index}
                className={[
                  'rota-week-view__time-label',
                  slot.isHourStart ? 'is-hour-start' : '',
                  slot.isBusinessHour ? 'is-business-hour' : '',
                ].filter(Boolean).join(' ')}
                style={{ height: `${SLOT_HEIGHT_PX}px` }}
              >
                {slot.label}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <WeekColumn
              key={day.toDateString()}
              day={day}
              sessions={sessions}
              gridHeightPx={GRID_HEIGHT_PX}
              isLoading={isLoading}
              selectedSessionId={selectedSessionId}
              onSelectSession={onSelectSession}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
