import { useState, useEffect } from 'react'
import { staffAPI, usersAPI } from '../../../services/api'
import type { StaffMember, SkillType } from '../../../services/api'
import { useAuth } from '../../../services/auth.context'

const SKILL_OPTIONS: { value: SkillType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'outreach', label: 'Outreach' },
]

const CONTRACT_LABELS: Record<string, string> = {
  salaried: 'Salaried',
  sessional: 'Sessional (by session)',
}

export function StaffPage() {
  const { token } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [contractType, setContractType] = useState<'salaried' | 'sessional'>('salaried')
  const [contractedHours, setContractedHours] = useState('')
  const [skills, setSkills] = useState<SkillType[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Reset password state
  const [resetMember, setResetMember] = useState<StaffMember | null>(null)
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  useEffect(() => {
    if (token) fetchStaff()
  }, [token])

  const fetchStaff = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const response = await staffAPI.list(token)
      setStaff(response.data || [])
    } catch (err) {
      setError(`Failed to load staff: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkillToggle = (skill: SkillType) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setContractType('salaried')
    setContractedHours('')
    setSkills([])
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await staffAPI.create(
        {
          email,
          password,
          firstName,
          lastName,
          phone: phone || null,
          contractType,
          contractedHoursPerWeek: contractedHours ? parseFloat(contractedHours) : null,
          skills,
        },
        token,
      )
      setSuccess(`Staff member ${firstName} ${lastName} added successfully.`)
      resetForm()
      await fetchStaff()
    } catch (err) {
      setError(`Failed to add staff member: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (member: StaffMember) => {
    if (!token) return
    setError('')
    setSuccess('')
    try {
      await staffAPI.update(member.id, { isActive: member.is_active === 0 }, token)
      setSuccess(`${member.is_active ? 'Deactivated' : 'Reactivated'} ${displayName(member)}.`)
      await fetchStaff()
    } catch (err) {
      setError(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const displayName = (member: StaffMember) =>
    member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : member.email

  const openResetPassword = (member: StaffMember) => {
    setResetMember(member)
    setResetNewPassword('')
    setResetConfirm('')
    setError('')
    setSuccess('')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !resetMember) return
    if (resetNewPassword !== resetConfirm) {
      setError('Passwords do not match')
      return
    }
    setResetSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await usersAPI.resetPassword(resetMember.id, resetNewPassword, token)
      setSuccess(`Password reset for ${displayName(resetMember)}.`)
      setResetMember(null)
    } catch (err) {
      setError(`Failed to reset password: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}

      <div style={{ marginBottom: '1.5rem' }}>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{ padding: '0.6rem 1.2rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + Add Staff Member
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginBottom: '2rem', padding: '1.25rem', border: '1px solid #ddd', borderRadius: '6px', maxWidth: '520px', background: '#fafafa' }}>
          <h3 style={{ marginTop: 0 }}>Add New Staff Member</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="first-name" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>First Name *</label>
                <input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label htmlFor="last-name" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Last Name *</label>
                <input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label htmlFor="staff-email" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Email *</label>
              <input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label htmlFor="staff-password" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Temporary Password * (min 10 characters)</label>
              <input id="staff-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label htmlFor="staff-phone" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Phone (optional)</label>
              <input id="staff-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="contract-type" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Contract Type *</label>
                <select id="contract-type" value={contractType} onChange={(e) => setContractType(e.target.value as 'salaried' | 'sessional')} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}>
                  <option value="salaried">Salaried</option>
                  <option value="sessional">Sessional (by session)</option>
                </select>
              </div>
              <div>
                <label htmlFor="contracted-hours" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Contracted Hrs/Week</label>
                <input id="contracted-hours" type="number" min="0" max="168" step="0.5" value={contractedHours} onChange={(e) => setContractedHours(e.target.value)} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 500 }}>Skills / Session Types</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {SKILL_OPTIONS.map((option) => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={skills.includes(option.value)} onChange={() => handleSkillToggle(option.value)} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" disabled={submitting} style={{ padding: '0.65rem 1.25rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {submitting ? 'Adding...' : 'Add Staff Member'}
              </button>
              <button type="button" onClick={resetForm} style={{ padding: '0.65rem 1.25rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3>Staff Directory</h3>
        {resetMember && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #f0ad4e', borderRadius: '6px', maxWidth: '420px', background: '#fff9f0' }}>
            <h4 style={{ marginTop: 0 }}>Reset Password — {displayName(resetMember)}</h4>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label htmlFor="reset-new-pw" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>New Password * (min 10 characters)</label>
                <input id="reset-new-pw" type="password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} required minLength={10} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label htmlFor="reset-confirm-pw" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Confirm New Password *</label>
                <input id="reset-confirm-pw" type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} required minLength={10} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={resetSubmitting} style={{ padding: '0.55rem 1rem', background: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {resetSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setResetMember(null)} style={{ padding: '0.55rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {loading ? (
          <p>Loading staff...</p>
        ) : staff.length === 0 ? (
          <p>No staff members found. Add one above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Contract</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Hrs/Week</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Phone</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Skills</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #eee', opacity: member.is_active ? 1 : 0.55 }}>
                  <td style={{ padding: '0.6rem' }}>{displayName(member)}</td>
                  <td style={{ padding: '0.6rem' }}>{member.email}</td>
                  <td style={{ padding: '0.6rem' }}>{member.contract_type ? CONTRACT_LABELS[member.contract_type] ?? member.contract_type : '—'}</td>
                  <td style={{ padding: '0.6rem' }}>{member.contracted_hours_per_week != null ? member.contracted_hours_per_week : '—'}</td>
                  <td style={{ padding: '0.6rem' }}>{member.phone || '—'}</td>
                  <td style={{ padding: '0.6rem' }}>{member.skills.length > 0 ? member.skills.map((skill) => SKILL_OPTIONS.find((option) => option.value === skill)?.label ?? skill).join(', ') : '—'}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.82rem', background: member.is_active ? '#d4edda' : '#f8d7da', color: member.is_active ? '#155724' : '#721c24' }}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.82rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}
                      >
                        {member.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openResetPassword(member)}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.82rem', cursor: 'pointer', border: '1px solid #f0ad4e', borderRadius: '4px', background: 'white', color: '#856404' }}
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
