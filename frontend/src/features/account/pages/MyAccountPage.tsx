import { useState } from 'react'
import { ALL_ROUTES } from '../../../app/routes/routeConfig'
import { authAPI } from '../../../services/api'
import { useAuth } from '../../../services/auth.context'

export function MyAccountPage() {
  const { token, user } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  if (!user) {
    return (
      <section className="account-page account-page--empty">
        <h3>Account unavailable</h3>
        <p>Sign in again to load your account details.</p>
      </section>
    )
  }

  const accessibleRoutes = ALL_ROUTES.filter((route) => route.allowedRoles.includes(user.role))
  const roleLabel = user.role === 'admin' ? 'Administrator' : 'Staff member'

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')
    try {
      await authAPI.changePassword({ currentPassword, newPassword }, token)
      setPwSuccess('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(`Failed to change password: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <section className="account-page" aria-label="My Account">
      <header className="account-page__hero">
        <div>
          <p className="account-page__eyebrow">My Account</p>
          <h3>{user.email}</h3>
          <p>Review your signed-in role and the frontend areas currently available to this account.</p>
        </div>
        <div className="account-page__status-card">
          <span className="account-page__status-label">Session</span>
          <strong>{token ? 'Authenticated' : 'Not authenticated'}</strong>
          <span>{roleLabel}</span>
        </div>
      </header>

      <div className="account-page__grid">
        <article className="account-page__panel">
          <h4>Profile summary</h4>
          <dl className="account-page__details">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{user.id}</dd>
            </div>
          </dl>
        </article>

        <article className="account-page__panel">
          <h4>Visible frontend features</h4>
          <ul className="account-page__route-list">
            {accessibleRoutes.map((route) => (
              <li key={route.path}>
                <strong>{route.label}</strong>
                <span>{route.description}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="account-page__panel" style={{ marginTop: '1.5rem', maxWidth: '420px' }}>
        <h4>Change Password</h4>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label htmlFor="current-password" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Current Password *</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label htmlFor="new-password" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>New Password * (min 10 characters)</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Confirm New Password *</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={10}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          {pwError && <p style={{ color: 'red', margin: 0 }}>{pwError}</p>}
          {pwSuccess && <p style={{ color: 'green', margin: 0 }}>{pwSuccess}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            style={{ padding: '0.65rem 1.25rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </article>
    </section>
  )
}