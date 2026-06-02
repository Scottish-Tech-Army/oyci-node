import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScheduledSession, StaffMember, AssignmentWithStaff, AssignmentWarning } from '../../model/rota.types'
import type { RotaService, AutoAssignResult } from '../../services/rota.api'
import { formatDuration, formatDayFull } from '../../model/rota.utils'
import { AvailableStaffList } from './AvailableStaffList'
import { AssignedStaffArea } from './AssignedStaffArea'

type StaffAllocationModalProps = {
  session: ScheduledSession
  rotaService: RotaService
  onClose: () => void
  onStaffingChanged: () => void
}

export function StaffAllocationModal({ session, rotaService, onClose, onStaffingChanged }: StaffAllocationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const successCelebrationTimeoutRef = useRef<number | null>(null)
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithStaff[]>([])
  const [warnings, setWarnings] = useState<Map<string, AssignmentWarning[]>>(new Map())
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)
  const [isCelebratingSuccess, setIsCelebratingSuccess] = useState(false)
  const [autoAssignResult, setAutoAssignResult] = useState<AutoAssignResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) {
      dialog.showModal()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const loadStaffData = useCallback(async () => {
    setIsLoadingStaff(true)
    setError(null)
    try {
      const [staff, sessionAssignments] = await Promise.all([
        rotaService.getAvailableStaffForSession(
          session.id,
          session.session_date,
          session.start_time,
          session.end_time,
        ),
        rotaService.getSessionAssignments(session.id),
      ])

      const assignedIds = new Set(sessionAssignments.map((a) => a.staff_id))
      setAvailableStaff(staff.filter((s) => !assignedIds.has(s.id)))
      setAssignments(sessionAssignments)

      // Check for double-booking warnings
      const warningMap = new Map<string, AssignmentWarning[]>()
      for (const assignment of sessionAssignments) {
        const isDoubleBooked = await rotaService.checkDoubleBooking(
          assignment.staff_id,
          session.session_date,
          session.start_time,
          session.end_time,
          session.id,
        )
        if (isDoubleBooked) {
          warningMap.set(assignment.id, [
            {
              type: 'double_booking',
              message: `${assignment.staff.first_name} is assigned to another session at this time`,
              severity: 'error',
            },
          ])
        }
      }
      setWarnings(warningMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff data')
    } finally {
      setIsLoadingStaff(false)
    }
  }, [rotaService, session])

  useEffect(() => {
    void loadStaffData()
  }, [loadStaffData])

  useEffect(() => {
    return () => {
      if (successCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(successCelebrationTimeoutRef.current)
      }
    }
  }, [])

  const triggerSuccessCelebration = useCallback(() => {
    if (successCelebrationTimeoutRef.current !== null) {
      window.clearTimeout(successCelebrationTimeoutRef.current)
      successCelebrationTimeoutRef.current = null
    }

    setIsCelebratingSuccess(false)

    window.requestAnimationFrame(() => {
      setIsCelebratingSuccess(true)
      successCelebrationTimeoutRef.current = window.setTimeout(() => {
        setIsCelebratingSuccess(false)
        successCelebrationTimeoutRef.current = null
      }, 1600)
    })
  }, [])

  const handleAssign = useCallback(async (staffId: string) => {
    setIsAssigning(true)
    setError(null)
    try {
      await rotaService.assignStaff(session.id, staffId)
      await loadStaffData()
      onStaffingChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign staff')
    } finally {
      setIsAssigning(false)
    }
  }, [rotaService, session.id, loadStaffData, onStaffingChanged])

  const handleRemove = useCallback(async (assignmentId: string) => {
    setIsRemoving(true)
    setError(null)
    try {
      await rotaService.removeAssignment(assignmentId)
      await loadStaffData()
      onStaffingChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment')
    } finally {
      setIsRemoving(false)
    }
  }, [rotaService, loadStaffData, onStaffingChanged])

  const handleAutoAssign = useCallback(async () => {
    setIsAutoAssigning(true)
    setAutoAssignResult(null)
    setError(null)

    try {
      const activeCount = assignments.filter(
        (a) => a.status !== 'declined' && a.status !== 'cancelled',
      ).length

      const result = await rotaService.autoAssignToMinimum(
        session.id,
        session.min_staff,
        activeCount,
        availableStaff,
      )

      setAutoAssignResult(result)

      if (!result.alreadyMet) {
        await loadStaffData()
        onStaffingChanged()
      }

      if (!result.alreadyMet && !result.isPartial && result.assignedCount > 0) {
        triggerSuccessCelebration()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-assign failed')
    } finally {
      setIsAutoAssigning(false)
    }
  }, [rotaService, session, assignments, availableStaff, loadStaffData, onStaffingChanged, triggerSuccessCelebration])

  const sessionDate = new Date(`${session.session_date}T00:00:00`)

  return (
    <dialog
      ref={dialogRef}
      className="staff-allocation-modal"
      aria-label={`Staff allocation for ${session.title}`}
      onClose={onClose}
    >
      <div className="staff-allocation-modal__content">
        <header className="staff-allocation-modal__header">
          <div>
            <p className="staff-allocation-modal__eyebrow">Staff Allocation</p>
            <h3>{session.title}</h3>
          </div>
          <button
            type="button"
            className="staff-allocation-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        <section className="staff-allocation-modal__details" aria-label="Session details">
          <dl className="staff-allocation-modal__detail-grid">
            <div>
              <dt>Date</dt>
              <dd>{formatDayFull(sessionDate)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{session.start_time} – {session.end_time}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(session.start_time, session.end_time)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{session.location}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{session.session_type ?? 'Standard'}</dd>
            </div>
            <div>
              <dt>Staffing</dt>
              <dd>{session.min_staff}{session.max_staff > 0 ? `–${session.max_staff}` : '+'} required</dd>
            </div>
          </dl>

          {session.notes ? (
            <div className="staff-allocation-modal__notes">
              <strong>Notes</strong>
              <p>{session.notes}</p>
            </div>
          ) : null}
        </section>

        {error ? (
          <p className="staff-allocation-modal__error" role="alert">{error}</p>
        ) : null}

        <section className="staff-allocation-modal__staffing" aria-label="Staff assignment">
          {isLoadingStaff ? (
            <div className="staff-allocation-modal__loading">
              <p>Loading staff data…</p>
            </div>
          ) : (
            <>
              <div className="staff-allocation-modal__auto-assign-bar">
                <p className="staff-allocation-modal__auto-assign-hint">
                  Minimum {session.min_staff} staff required.{' '}
                  Auto-assign fills available slots up to the minimum — you can adjust manually after.
                </p>
                <button
                  type="button"
                  className={`staff-allocation-modal__auto-assign-btn${isCelebratingSuccess ? ' is-celebrating' : ''}`}
                  onClick={() => void handleAutoAssign()}
                  disabled={isAutoAssigning || isAssigning || isRemoving}
                  aria-busy={isAutoAssigning}
                >
                  <span className="staff-allocation-modal__auto-assign-btn-content">
                    <span className="staff-allocation-modal__auto-assign-icon" aria-hidden="true">
                      ⚡
                    </span>
                    <span>{isAutoAssigning ? 'Assigning…' : 'Auto-assign to minimum'}</span>
                  </span>
                </button>
              </div>

              {autoAssignResult ? (
                <div
                  className={`staff-allocation-modal__auto-assign-result${autoAssignResult.alreadyMet ? ' is-already-met' : autoAssignResult.isPartial ? ' is-partial' : ' is-success'}${isCelebratingSuccess && !autoAssignResult.alreadyMet && !autoAssignResult.isPartial ? ' is-celebrating' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {autoAssignResult.alreadyMet ? (
                    <span>✓ Session is already staffed to the minimum of {session.min_staff}. No changes made.</span>
                  ) : autoAssignResult.isPartial ? (
                    <span>
                      ⚠ Only {autoAssignResult.assignedCount} of {autoAssignResult.neededCount} needed staff could be assigned — not enough available staff for this slot.
                      Please assign the remaining staff manually or check availability.
                    </span>
                  ) : (
                    <span>✓ {autoAssignResult.assignedCount} staff assigned — minimum staffing requirement met.</span>
                  )}
                </div>
              ) : null}

              <div className="staff-allocation-modal__split">
                <div className="staff-allocation-modal__available">
                  <h4>Available staff</h4>
                  <AvailableStaffList
                    staff={availableStaff}
                    onAssign={handleAssign}
                    isAssigning={isAssigning}
                  />
                </div>
                <div className="staff-allocation-modal__assigned">
                  <h4>Assigned staff</h4>
                  <AssignedStaffArea
                    assignments={assignments}
                    warnings={warnings}
                    onRemove={handleRemove}
                    isRemoving={isRemoving}
                    minStaff={session.min_staff}
                    maxStaff={session.max_staff}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="staff-allocation-modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </dialog>
  )
}
