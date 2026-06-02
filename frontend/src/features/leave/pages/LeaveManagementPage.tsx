import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { endOfMonth, formatLocalDateKey, formatMonthTitle, shiftMonth, startOfMonth } from '../../calendar/model/calendar.utils'
import { leaveAPI } from '../../../services/api'
import { useAuth } from '../../../services/auth.context'

type LeaveType = 'away' | 'sick'
type LeaveDayStatus = 'available' | 'away' | 'sick'

type LeaveEntry = {
  id: string
  userId: string
  userName: string
  startDate: string
  endDate: string
  type: LeaveType
  notes: string
}

type LeaveDayCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
  isToday: boolean
  status: LeaveDayStatus
  entries: LeaveEntry[]
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  away: 'Away',
  sick: 'Sick',
}

const DAY_STATUS_LABELS: Record<LeaveDayStatus, string> = {
  available: 'Available',
  away: 'Away',
  sick: 'Sick',
}

function getDayStatus(entries: LeaveEntry[]): LeaveDayStatus {
  if (entries.some((entry) => entry.type === 'sick')) {
    return 'sick'
  }

  if (entries.length > 0) {
    return 'away'
  }

  return 'available'
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isDateWithinEntry(dateKey: string, entry: LeaveEntry) {
  return dateKey >= entry.startDate && dateKey <= entry.endDate
}

function doesEntryOverlapMonth(entry: LeaveEntry, monthDate: Date) {
  const monthStart = formatLocalDateKey(startOfMonth(monthDate))
  const monthEnd = formatLocalDateKey(endOfMonth(monthDate))
  return entry.startDate <= monthEnd && entry.endDate >= monthStart
}

function buildMonthCells(monthDate: Date, entries: LeaveEntry[]) {
  const firstDay = startOfMonth(monthDate)
  const monthIndex = firstDay.getMonth()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())
  const todayKey = formatLocalDateKey(new Date())

  const cells: LeaveDayCell[] = []
  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart)
    cellDate.setDate(gridStart.getDate() + index)
    const isoDate = formatLocalDateKey(cellDate)

    cells.push({
      isoDate,
      dayOfMonth: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthIndex,
      isToday: isoDate === todayKey,
      entries: entries.filter((entry) => isDateWithinEntry(isoDate, entry)),
      status: getDayStatus(entries.filter((entry) => isDateWithinEntry(isoDate, entry))),
    })
  }

  return cells
}

function formatLeaveRange(entry: LeaveEntry) {
  const start = parseDateOnly(entry.startDate)
  const end = parseDateOnly(entry.endDate)

  const startLabel = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return entry.startDate === entry.endDate ? startLabel : `${startLabel} - ${endLabel}`
}

export function LeaveManagementPage() {
  const { token, user } = useAuth()
  const [activeMonth, setActiveMonth] = useState(() => new Date())
  const [entries, setEntries] = useState<LeaveEntry[]>([])
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState<LeaveType>('away')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadEntries(authToken: string, showLoading = true) {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      setLoadError('')
      const response = await leaveAPI.list(authToken)
      setEntries(
        ((response.data ?? []) as Array<{
          id: string
          userId: string
          userName: string
          startDate: string
          endDate: string
          leaveType: LeaveType
          notes: string | null
        }>).map((entry) => ({
          id: entry.id,
          userId: entry.userId,
          userName: entry.userName,
          startDate: entry.startDate,
          endDate: entry.endDate,
          type: entry.leaveType,
          notes: entry.notes ?? '',
        })),
      )
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load leave entries')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!token) {
      setEntries([])
      setIsLoading(false)
      return
    }

    void loadEntries(token)
  }, [token])

  const monthEntries = useMemo(
    () => entries.filter((entry) => doesEntryOverlapMonth(entry, activeMonth)),
    [entries, activeMonth],
  )

  const monthCells = useMemo(() => buildMonthCells(activeMonth, monthEntries), [activeMonth, monthEntries])
  const myEntries = useMemo(
    () => entries.filter((entry) => entry.userId === user?.id).sort((first, second) => first.startDate.localeCompare(second.startDate)),
    [entries, user?.id],
  )

  const resetForm = () => {
    setEditingEntryId(null)
    setStartDate('')
    setEndDate('')
    setLeaveType('away')
    setNotes('')
  }

  const populateForm = (entry: LeaveEntry) => {
    setEditingEntryId(entry.id)
    setStartDate(entry.startDate)
    setEndDate(entry.endDate)
    setLeaveType(entry.type)
    setNotes(entry.notes)
    setError('')
    setSuccess('')
    setActiveMonth(parseDateOnly(entry.startDate))
  }

  const handleDelete = async (entryId: string) => {
    if (!token) {
      setError('Sign in to remove leave.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await leaveAPI.remove(entryId, token)
      await loadEntries(token, false)

      if (editingEntryId === entryId) {
        resetForm()
      }

      setSuccess('Leave removed from the shared calendar.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove leave')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user || !token) {
      setError('Sign in to assign leave.')
      return
    }

    if (!startDate || !endDate) {
      setError('Select a start date and end date for the leave request.')
      return
    }

    if (startDate > endDate) {
      setError('The end date must be on or after the start date.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        startDate,
        endDate,
        leaveType,
        notes: notes.trim() || null,
      }

      if (editingEntryId) {
        await leaveAPI.update(editingEntryId, payload, token)
      } else {
        await leaveAPI.create(payload, token)
      }

      await loadEntries(token, false)

      const successMessage = editingEntryId
        ? 'Leave updated on the shared calendar.'
        : 'Leave added to the shared calendar.'

      resetForm()
      setSuccess(successMessage)
      setActiveMonth(parseDateOnly(startDate))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save leave')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="leave-page" aria-label="Leave Management">
      <header className="leave-page__hero">
        <div>
          <p className="leave-page__eyebrow">Leave Management</p>
          <h3>Team leave calendar</h3>
          <p>Assign your own leave, review who is out across the month, and plan around upcoming absences.</p>
        </div>

        <dl className="leave-page__summary" aria-label="Leave summary for selected month">
          <div>
            <dt>Month</dt>
            <dd>{formatMonthTitle(activeMonth)}</dd>
          </div>
          <div>
            <dt>Team entries</dt>
            <dd>{monthEntries.length}</dd>
          </div>
          <div>
            <dt>Your entries</dt>
            <dd>{myEntries.length}</dd>
          </div>
        </dl>
      </header>

      {loadError ? (
        <div className="leave-form__feedback leave-form__feedback--error" role="alert">
          {loadError}
        </div>
      ) : null}

      <div className="leave-page__layout">
        <section className="leave-page__panel leave-page__panel--form" aria-labelledby="leave-form-heading">
          <div className="leave-page__panel-header">
            <div>
              <p className="leave-page__section-label">Assign leave</p>
              <h4 id="leave-form-heading">
                {editingEntryId ? 'Update your leave entry' : 'Add your leave to the team calendar'}
              </h4>
            </div>
          </div>

          <form className="leave-form" onSubmit={handleSubmit}>
            <label>
              <span>Start date</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </label>

            <label>
              <span>End date</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
            </label>

            <label>
              <span>Leave type</span>
              <select value={leaveType} onChange={(event) => setLeaveType(event.target.value as LeaveType)}>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Notes</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional context for the team"
              />
            </label>

            {error ? <p className="leave-form__feedback leave-form__feedback--error">{error}</p> : null}
            {success ? <p className="leave-form__feedback leave-form__feedback--success">{success}</p> : null}

            <div className="leave-form__actions">
              <button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? 'Saving...' : editingEntryId ? 'Update leave' : 'Save leave'}
              </button>
              {editingEntryId ? (
                <button type="button" className="leave-form__secondary-action" onClick={resetForm} disabled={isSaving}>
                  Cancel editing
                </button>
              ) : null}
            </div>
          </form>

          <div className="leave-page__mine">
            <h5>Your leave entries</h5>
            {isLoading ? (
              <p>Loading leave entries...</p>
            ) : myEntries.length === 0 ? (
              <p>No leave added yet.</p>
            ) : (
              <ul className="leave-page__entry-list">
                {myEntries.map((entry) => (
                  <li key={entry.id}>
                    <div className="leave-page__entry-copy">
                      <strong>{LEAVE_TYPE_LABELS[entry.type]}</strong>
                      <span>{formatLeaveRange(entry)}</span>
                      {entry.notes ? <small>{entry.notes}</small> : null}
                    </div>
                    <div className="leave-page__entry-actions">
                      <button type="button" className="leave-page__entry-action" onClick={() => populateForm(entry)} disabled={isSaving}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="leave-page__entry-action leave-page__entry-action--danger"
                        onClick={() => void handleDelete(entry.id)}
                        disabled={isSaving}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="leave-page__panel leave-page__panel--calendar" aria-labelledby="leave-calendar-heading">
          <div className="leave-calendar__toolbar">
            <div>
              <p className="leave-page__section-label">Monthly view</p>
              <h4 id="leave-calendar-heading">{formatMonthTitle(activeMonth)}</h4>
            </div>

            <div className="leave-calendar__controls">
              <button type="button" onClick={() => setActiveMonth((current) => shiftMonth(current, -1))}>
                Previous month
              </button>
              <button type="button" onClick={() => setActiveMonth(new Date())}>
                This month
              </button>
              <button type="button" onClick={() => setActiveMonth((current) => shiftMonth(current, 1))}>
                Next month
              </button>
            </div>
          </div>

          <div className="leave-calendar__scroller">
            <div className="leave-calendar__board">
              <div className="leave-calendar__weekday-row" aria-hidden="true">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              {isLoading ? (
                <p>Loading leave calendar...</p>
              ) : (
                <div className="leave-calendar__grid">
                  {monthCells.map((cell) => (
                    <article
                      key={cell.isoDate}
                      className={[
                        'leave-calendar__cell',
                        cell.inCurrentMonth ? '' : 'is-outside-month',
                        cell.isToday ? 'is-today' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <header className="leave-calendar__cell-header">
                        <span className="leave-calendar__day-number">{cell.dayOfMonth}</span>
                        <small className={`leave-calendar__status leave-calendar__status--${cell.status}`}>
                          {DAY_STATUS_LABELS[cell.status]}
                        </small>
                      </header>

                      <div className="leave-calendar__cell-list">
                        {cell.entries.slice(0, 3).map((entry) => (
                          <span key={`${cell.isoDate}-${entry.id}`} className={`leave-chip leave-chip--${entry.type}`}>
                            {entry.userName}
                          </span>
                        ))}
                        {cell.entries.length > 3 ? <span className="leave-chip leave-chip--more">+{cell.entries.length - 3} more</span> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="leave-page__month-list">
            <h5>Team leave in {formatMonthTitle(activeMonth)}</h5>
            {monthEntries.length === 0 ? (
              <p>No leave recorded for this month.</p>
            ) : (
              <ul className="leave-page__entry-list leave-page__entry-list--detailed">
                {monthEntries.map((entry) => (
                  <li key={entry.id}>
                    <div>
                      <strong>{entry.userName}</strong>
                      <span>{LEAVE_TYPE_LABELS[entry.type]}</span>
                    </div>
                    <div>
                      <span>{formatLeaveRange(entry)}</span>
                      {entry.notes ? <small>{entry.notes}</small> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}