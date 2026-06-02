import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotaToolbar } from '../components/RotaToolbar'
import { WeekView } from '../components/WeekView/WeekView'
import { StaffingQueue } from '../components/StaffingQueue/StaffingQueue'
import { StaffAllocationModal } from '../components/StaffAllocationModal/StaffAllocationModal'
import type { ScheduledSession } from '../model/rota.types'
import { useAuth } from '../../../services/auth.context'
import { formatWeekLabel, getMondayOfWeek, getWeeksInMonth } from '../model/rota.utils'
import { createRotaService } from '../services/rota.api'

function findWeekIndex(date: Date, weekOptions: Date[]) {
  const monday = getMondayOfWeek(date).getTime()
  const matchingIndex = weekOptions.findIndex((weekStart) => weekStart.getTime() === monday)
  return matchingIndex >= 0 ? matchingIndex : 0
}

export function RotaPlannerPage() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const [weekSessions, setWeekSessions] = useState<ScheduledSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedMonth = selectedDate.getMonth()
  const selectedYear = selectedDate.getFullYear()
  const rotaService = useMemo(() => createRotaService(token ?? undefined), [token])

  const weekOptions = useMemo(() => getWeeksInMonth(selectedYear, selectedMonth), [selectedMonth, selectedYear])

  useEffect(() => {
    setSelectedWeekIndex(findWeekIndex(selectedDate, weekOptions))
  }, [selectedDate, weekOptions])

  const selectedWeekStart = weekOptions[selectedWeekIndex] ?? getMondayOfWeek(selectedDate)

  useEffect(() => {
    let isMounted = true

    const loadWeekSessions = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const sessions = await rotaService.getWeekSessions(selectedWeekStart)
        if (isMounted) {
          setWeekSessions(sessions)
        }
      } catch (error) {
        if (isMounted) {
          setWeekSessions([])
          setLoadError(error instanceof Error ? error.message : 'Unable to load rota sessions.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadWeekSessions()

    return () => {
      isMounted = false
    }
  }, [rotaService, selectedWeekStart, refreshKey])

  // Clear selected session when week changes
  useEffect(() => {
    setSelectedSession(null)
  }, [selectedWeekStart])

  const weekLabel = useMemo(
    () => formatWeekLabel(selectedWeekIndex, selectedWeekStart),
    [selectedWeekIndex, selectedWeekStart],
  )

  const totalHours = useMemo(
    () =>
      weekSessions.reduce((sum, session) => {
        const [startHours, startMinutes] = session.start_time.split(':').map(Number)
        const [endHours, endMinutes] = session.end_time.split(':').map(Number)
        const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
        return sum + duration / 60
      }, 0),
    [weekSessions],
  )

  const sessionsNeedingStaff = useMemo(
    () => weekSessions.filter((session) => (session.assigned_staff_count ?? 0) < session.min_staff).length,
    [weekSessions],
  )

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => selectedYear - 2 + index),
    [selectedYear],
  )

  const handleSelectSession = useCallback((session: ScheduledSession) => {
    setSelectedSession(session)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedSession(null)
  }, [])

  const handleStaffingChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleReturnToCurrentWeek = useCallback(() => {
    const currentDate = new Date()
    const currentWeekOptions = getWeeksInMonth(currentDate.getFullYear(), currentDate.getMonth())

    setSelectedDate(currentDate)
    setSelectedWeekIndex(findWeekIndex(currentDate, currentWeekOptions))
  }, [])

  return (
    <section className="rota-planner-page" aria-label="Rota Planner">
      <div className="rota-planner-page__summary-bar">
        <dl className="rota-planner-page__summary rota-planner-page__summary--row" aria-label="Selected week summary">
          <div className="rota-planner-page__summary-card">
            <dt>Visible week</dt>
            <dd>{weekLabel}</dd>
          </div>
          <div className="rota-planner-page__summary-card">
            <dt>Scheduled sessions</dt>
            <dd>{weekSessions.length}</dd>
          </div>
          <div className="rota-planner-page__summary-card">
            <dt>Planned delivery hours</dt>
            <dd>{totalHours.toFixed(1)}h</dd>
          </div>
          <div className="rota-planner-page__summary-card">
            <dt>Needs staffing</dt>
            <dd>{sessionsNeedingStaff}</dd>
          </div>
        </dl>
      </div>

      <RotaToolbar
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        weekOptions={weekOptions.map((weekStart, index) => ({
          value: index,
          label: formatWeekLabel(index, weekStart),
        }))}
        selectedWeekIndex={selectedWeekIndex}
        onMonthChange={(month) => {
          setSelectedDate(new Date(selectedYear, month, 1))
          setSelectedWeekIndex(0)
        }}
        onYearChange={(year) => {
          setSelectedDate(new Date(year, selectedMonth, 1))
          setSelectedWeekIndex(0)
        }}
        onWeekSelect={setSelectedWeekIndex}
        onReturnToCurrentWeek={handleReturnToCurrentWeek}
      />

      {loadError ? <p className="warning-banner">{loadError}</p> : null}

      <div className="rota-planner-page__stage-layout">
        <WeekView
          weekStart={selectedWeekStart}
          sessions={weekSessions}
          isLoading={isLoading}
          selectedSessionId={selectedSession?.id ?? null}
          onSelectSession={handleSelectSession}
        />

        <StaffingQueue
          sessions={weekSessions}
          selectedSessionId={selectedSession?.id ?? null}
          onSelectSession={handleSelectSession}
        />
      </div>

      {selectedSession ? (
        <StaffAllocationModal
          session={selectedSession}
          rotaService={rotaService}
          onClose={handleCloseModal}
          onStaffingChanged={handleStaffingChanged}
        />
      ) : null}
    </section>
  )
}
