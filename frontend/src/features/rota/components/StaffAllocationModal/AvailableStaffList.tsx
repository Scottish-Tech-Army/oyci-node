import type { StaffMember } from '../../model/rota.types'

type AvailableStaffListProps = {
  staff: StaffMember[]
  onAssign: (staffId: string) => void
  isAssigning: boolean
}

function contractLabel(type: StaffMember['contract_type']): string {
  if (type === null) {
    return ''
  }

  return type === 'sessional' ? 'Sessional' : 'Salaried'
}

function displayName(member: StaffMember): string {
  const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ').trim()
  return fullName || member.email
}

export function AvailableStaffList({ staff, onAssign, isAssigning }: AvailableStaffListProps) {
  if (staff.length === 0) {
    return (
      <div className="available-staff-list__empty">
        <p>No available staff for this session slot.</p>
      </div>
    )
  }

  return (
    <ul className="available-staff-list" aria-label="Available staff">
      {staff.map((member) => (
        <li key={member.id} className="available-staff-list__item">
          <div className="available-staff-list__info">
            <strong>{displayName(member)}</strong>
            {contractLabel(member.contract_type) ? (
              <span className="available-staff-list__contract">{contractLabel(member.contract_type)}</span>
            ) : null}
            <span>{member.email}</span>
          </div>
          <div className="available-staff-list__skills">
            {member.skills.map((skill) => (
              <span key={skill.id} className="available-staff-list__skill-badge">{skill.name}</span>
            ))}
          </div>
          <button
            type="button"
            className="available-staff-list__assign-btn"
            onClick={() => onAssign(member.id)}
            disabled={isAssigning}
            aria-label={`Assign ${displayName(member)}`}
          >
            + Assign
          </button>
        </li>
      ))}
    </ul>
  )
}
