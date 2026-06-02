import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sessionsAPI } from '../../../services/api'
import { useAuth } from '../../../services/auth.context'

type SessionApiRow = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  session_type: string
  notes: string | null
  attendees: number | null
  created_at: string
}

type Session = Omit<SessionApiRow, 'attendees'> & {
  minStaffRequired: number | null
}

const SESSION_TYPES = ['standard', 'mentoring', 'workshop', 'outreach'] as const
type SessionType = (typeof SESSION_TYPES)[number]

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  standard: 'Standard',
  mentoring: 'Mentoring',
  workshop: 'Workshop',
  outreach: 'Outreach',
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDateTime(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Date unavailable'
  }

  return dateTimeFormatter.format(parsed)
}

function formatSessionTypeLabel(value: string) {
  if (value in SESSION_TYPE_LABELS) {
    return SESSION_TYPE_LABELS[value as SessionType]
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function mapSessionRow(session: SessionApiRow): Session {
  return {
    ...session,
    minStaffRequired: session.attendees,
  }
}

export function SessionsPage() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('standard')
  const [notes, setNotes] = useState('')
  const [minStaffRequired, setMinStaffRequired] = useState('')

  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadSessions = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        setLoadError('')
        const response = await sessionsAPI.list(token)
        const sessionRows = (response.data ?? []) as SessionApiRow[]
        setSessions(sessionRows.map(mapSessionRow))
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    void loadSessions()
  }, [token])

  useEffect(() => {
    if (!isCreateModalOpen) {
      return
    }

    titleInputRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        setIsCreateModalOpen(false)
        setSubmitError('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCreateModalOpen, saving])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setSessionType('standard')
    setNotes('')
    setMinStaffRequired('')
    setSubmitError('')
  }

  const openCreateModal = () => {
    setSubmitError('')
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (saving) {
      return
    }

    setSubmitError('')
    setIsCreateModalOpen(false)
  }

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setSubmitError('Not authenticated')
      return
    }

    setSaving(true)
    setSubmitError('')
    setSuccess('')

    try {
      await sessionsAPI.create(
        {
          title,
          description: description || null,
          startTime,
          endTime,
          location: location || null,
          sessionType,
          notes: notes || null,
          // Compat: minStaffRequired is serialised as `attendees` by toBackendSessionPayload in api.ts.
          // TODO(backend-min-staff): remove this comment once the backend returns a real min_staff field.
          minStaffRequired: minStaffRequired ? Number(minStaffRequired) : null,
        },
        token,
      )

      resetForm()
      setIsCreateModalOpen(false)
      setSuccess('Session created. Open the rota planner to assign staff and meet the minimum staffing requirement.')

      try {
        const refreshed = await sessionsAPI.list(token)
        const refreshedRows = (refreshed.data ?? []) as SessionApiRow[]
        setSessions(refreshedRows.map(mapSessionRow))
        setLoadError('')
      } catch (err) {
        setLoadError(
          err instanceof Error
            ? `Session created, but the sessions list could not be refreshed: ${err.message}`
            : 'Session created, but the sessions list could not be refreshed.',
        )
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sessions-page">
      {loadError ? (
        <div className="sessions-page__feedback sessions-page__feedback--error" role="alert">
          <strong>Could not fully load sessions.</strong>
          <p>{loadError}</p>
        </div>
      ) : null}

      {success ? (
        <div className="sessions-page__feedback sessions-page__feedback--success" role="status" aria-live="polite">
          <strong>Session saved.</strong>
          <p>{success}</p>
        </div>
      ) : null}

      <section className="sessions-page__card" aria-labelledby="sessions-list-heading">
        <header className="sessions-page__card-header sessions-page__card-header--action">
          <div>
            <p className="sessions-page__section-label">Sessions</p>
            <h3 id="sessions-list-heading">Operational schedule</h3>
            <p>Create sessions and set the minimum staff required. Then open the rota planner to assign staff to each session.</p>
          </div>

          <button type="button" className="sessions-page__primary-action" onClick={openCreateModal}>
            Create session
          </button>
        </header>

        {loading ? (
          <div className="sessions-page__state" role="status" aria-live="polite">
            <strong>Loading sessions...</strong>
            <p>Pulling the latest schedule from the system.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="sessions-page__state sessions-page__state--empty">
            <strong>No sessions saved yet.</strong>
            <p>Use the create session button to add the first item to the delivery schedule.</p>
          </div>
        ) : (
          <div className="sessions-table__wrap">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Type</th>
                  <th scope="col">Location</th>
                  <th scope="col">Min. staff req.</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div className="sessions-table__primary">{session.title}</div>
                      <div className="sessions-table__secondary">
                        {session.description?.trim() ? session.description : 'No description added yet.'}
                      </div>
                    </td>
                    <td>{formatDateTime(session.start_time)}</td>
                    <td>{formatDateTime(session.end_time)}</td>
                    <td>
                      <span className="sessions-table__type-badge">
                        {formatSessionTypeLabel(session.session_type)}
                      </span>
                    </td>
                    <td>{session.location ?? <span className="sessions-table__muted">Not set</span>}</td>
                    <td>
                      {session.minStaffRequired != null ? (
                        <span className="sessions-table__staffing-badge">{session.minStaffRequired} staff</span>
                      ) : (
                        <span className="sessions-table__muted">Not set</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreateModalOpen ? (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sessions-create-modal-title"
            className="modal-content sessions-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header sessions-modal__header">
              <div>
                <h2 id="sessions-create-modal-title">Create session</h2>
                <p className="sessions-modal__intro">
                  Fill in the session details and set the minimum number of staff required. Staff allocation happens in the rota planner after the session is created.
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
                aria-label="Close create session dialog"
                disabled={saving}
              >
                ✕
              </button>
            </header>

            <div className="modal-body sessions-modal__body">
              {submitError ? (
                <div className="sessions-page__feedback sessions-page__feedback--error" role="alert">
                  <strong>Session could not be saved.</strong>
                  <p>{submitError}</p>
                </div>
              ) : null}

              <form className="sessions-form" onSubmit={handleCreateSession}>
                <section className="sessions-form__section" aria-labelledby="sessions-core-details-heading">
                  <div className="sessions-form__section-heading">
                    <h4 id="sessions-core-details-heading">Core details</h4>
                    <p>Use a clear title and session type so the schedule is easy to scan later.</p>
                  </div>

                  <div className="sessions-form__grid">
                    <label className="sessions-form__field sessions-form__field--full">
                      <span>Title</span>
                      <input
                        ref={titleInputRef}
                        className="sessions-form__control"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Easter youth drop-in"
                        required
                      />
                    </label>

                    <label className="sessions-form__field sessions-form__field--full">
                      <span>Description</span>
                      <textarea
                        className="sessions-form__control sessions-form__control--textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a short summary for staff."
                        rows={3}
                      />
                    </label>

                    <label className="sessions-form__field">
                      <span>Session type</span>
                      <select
                        className="sessions-form__control"
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value as SessionType)}
                      >
                        {SESSION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {SESSION_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="sessions-form__section" aria-labelledby="sessions-timing-heading">
                  <div className="sessions-form__section-heading">
                    <h4 id="sessions-timing-heading">Timing and location</h4>
                    <p>Add the time window and venue so the session is ready for rota planning.</p>
                  </div>

                  <div className="sessions-form__grid">
                    <label className="sessions-form__field">
                      <span>Start time</span>
                      <input
                        className="sessions-form__control"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </label>

                    <label className="sessions-form__field">
                      <span>End time</span>
                      <input
                        className="sessions-form__control"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </label>

                    <label className="sessions-form__field sessions-form__field--full">
                      <span>Location</span>
                      <input
                        className="sessions-form__control"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Community hub, Alloa"
                      />
                    </label>
                  </div>
                </section>

                <section className="sessions-form__section" aria-labelledby="sessions-staffing-heading">
                  <div className="sessions-form__section-heading">
                    <h4 id="sessions-staffing-heading">Staffing requirement</h4>
                    <p>Set the minimum number of staff needed to safely deliver this session. Staff will be assigned in the rota planner once the session is saved.</p>
                  </div>

                  <div className="sessions-form__grid">
                    <label className="sessions-form__field">
                      <span>Minimum staff required</span>
                      <input
                        className="sessions-form__control"
                        type="number"
                        min={1}
                        value={minStaffRequired}
                        onChange={(e) => setMinStaffRequired(e.target.value)}
                        placeholder="e.g. 2"
                        required
                      />
                    </label>

                    <label className="sessions-form__field sessions-form__field--full">
                      <span>Notes</span>
                      <textarea
                        className="sessions-form__control sessions-form__control--textarea"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add safeguarding, logistics, or delivery notes."
                        rows={3}
                      />
                    </label>
                  </div>
                </section>

                <div className="sessions-modal__actions">
                  <button
                    type="button"
                    className="sessions-modal__secondary-action"
                    onClick={closeCreateModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sessions-form__submit" disabled={saving}>
                    {saving ? 'Saving session...' : 'Create session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
