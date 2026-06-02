import type { AssignmentWithStaff, AssignmentWarning } from '../../model/rota.types'

type AssignedStaffAreaProps = {
  assignments: AssignmentWithStaff[]
  warnings: Map<string, AssignmentWarning[]>
  onRemove: (assignmentId: string) => void
  isRemoving: boolean
  minStaff: number
  maxStaff: number
}

function statusLabel(status: AssignmentWithStaff['status']): string {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'declined') return 'Declined'
  if (status === 'cancelled') return 'Cancelled'
  return 'Proposed'
}

function statusTone(status: AssignmentWithStaff['status']): string {
  if (status === 'confirmed') return 'confirmed'
  if (status === 'declined' || status === 'cancelled') return 'removed'
  return 'proposed'
}

function displayName(assignment: AssignmentWithStaff): string {
  const fullName = [assignment.staff.first_name, assignment.staff.last_name].filter(Boolean).join(' ').trim()
  return fullName || assignment.staff.email
}

export function AssignedStaffArea({ assignments, warnings, onRemove, isRemoving, minStaff, maxStaff }: AssignedStaffAreaProps) {
  const activeCount = assignments.filter((a) => a.status !== 'declined' && a.status !== 'cancelled').length
  const isUnder = activeCount < minStaff
  const isOver = maxStaff > 0 && activeCount > maxStaff

  return (
    <div className="assigned-staff-area">
      <div className="assigned-staff-area__header">
        <span className="assigned-staff-area__count">
          {activeCount} / {minStaff} staff
        </span>
        {isUnder ? (
          <span className="assigned-staff-area__warning is-understaffed">
            Needs {minStaff - activeCount} more
          </span>
        ) : null}
        {isOver ? (
          <span className="assigned-staff-area__warning is-overstaffed">
            Over maximum ({maxStaff})
          </span>
        ) : null}
        {!isUnder && !isOver ? (
          <span className="assigned-staff-area__warning is-ok">
            Meets minimum
          </span>
        ) : null}
      </div>

      {assignments.length === 0 ? (
        <div className="assigned-staff-area__empty">
          <p>No staff assigned yet. Use the list on the left to assign available staff.</p>
        </div>
      ) : (
        <ul className="assigned-staff-area__list" aria-label="Assigned staff">
          {assignments.map((assignment) => {
            const assignmentWarnings = warnings.get(assignment.id) ?? []
            const tone = statusTone(assignment.status)

            return (
              <li key={assignment.id} className={`assigned-staff-area__item assigned-staff-area__item--${tone}`}>
                <div className="assigned-staff-area__item-info">
                  <strong>{displayName(assignment)}</strong>
                  <span>{assignment.staff.email}</span>
                  <span className={`assigned-staff-area__status-badge is-${tone}`}>
                    {statusLabel(assignment.status)}
                  </span>
                </div>

                {assignmentWarnings.length > 0 ? (
                  <ul className="assigned-staff-area__warnings" aria-label="Assignment warnings">
                    {assignmentWarnings.map((w, i) => (
                      <li key={i} className={`assigned-staff-area__warning-msg is-${w.severity}`}>
                        {w.message}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <button
                  type="button"
                  className="assigned-staff-area__remove-btn"
                  onClick={() => onRemove(assignment.id)}
                  disabled={isRemoving}
                  aria-label={`Remove ${displayName(assignment)}`}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
