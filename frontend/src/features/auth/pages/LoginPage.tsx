import { useId, useState, type FormEvent } from 'react'
import { useAuth } from '../../../services/auth.context'
import oyciLogo from '../../../../OYCI-Logo.png'

type LoginPageProps = {
  isSessionExpired: boolean
  onLogin: () => void
}

export function LoginPage({ isSessionExpired, onLogin }: LoginPageProps) {
  const { login, isLoading, error: authError } = useAuth()
  const emailHintId = useId()
  const passwordHintId = useId()
  const errorMessageId = useId()
  const [email, setEmail] = useState('admin@oyci.internal')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const activeError = error || authError
  const emailDescribedBy = activeError ? `${emailHintId} ${errorMessageId}` : emailHintId
  const passwordDescribedBy = activeError ? `${passwordHintId} ${errorMessageId}` : passwordHintId

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <main className="auth-page auth-page--login">
      <section className="auth-card auth-card--login" aria-labelledby="login-title" aria-live="polite">
        <header className="auth-card__header">
          <img className="auth-card__logo" src={oyciLogo} alt="OYCI logo" />
          <div className="auth-card__brand-copy">
            <p className="auth-card__eyebrow">Ochil Youth Community Improvement</p>
            <h1 id="login-title">Sign in to the operations platform</h1>
            <p className="auth-subtitle">
              Secure internal access for rota planning, session coordination, and staff operations.
            </p>
          </div>
        </header>

        <div className="auth-card__intro">
          <p>
            Keep weekly planning clear and practical with one place to review staffing, upcoming sessions, and operational updates.
          </p>
          <ul className="auth-card__highlights" aria-label="Platform highlights">
            <li>Review rota coverage and staffing needs at a glance</li>
            <li>Support office teams with clear, role-aware internal access</li>
            <li>Reduce spreadsheet cross-checking for busy back-office staff</li>
          </ul>
        </div>

        {isSessionExpired ? (
          <p className="auth-warning" role="status">
            Your session expired. Please sign in again to continue.
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="email-input">Email address</label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              inputMode="email"
              required
              disabled={isLoading}
              aria-describedby={emailDescribedBy}
              aria-invalid={activeError ? 'true' : 'false'}
            />
            <p id={emailHintId} className="auth-form__hint">
              Use your internal OYCI account email.
            </p>
          </div>

          <div className="auth-form__field">
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={isLoading}
              aria-describedby={passwordDescribedBy}
              aria-invalid={activeError ? 'true' : 'false'}
            />
            <p id={passwordHintId} className="auth-form__hint">
              Passwords are case sensitive.
            </p>
          </div>

          {activeError ? (
            <p id={errorMessageId} className="auth-form__error" role="alert">
              {activeError}
            </p>
          ) : null}

          <div className="auth-actions auth-actions--stacked">
            <button type="submit" className="auth-submit-button" disabled={isLoading} aria-describedby={activeError ? errorMessageId : undefined}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            <p className="auth-form__footnote">Access is limited to authorised OYCI staff accounts.</p>
          </div>
        </form>

        <aside className="auth-support-panel" aria-label="Demo credentials">
          <p className="auth-support-panel__title">Demo credentials</p>
          <dl className="auth-support-panel__credentials">
            <div>
              <dt>Admin</dt>
              <dd>admin@oyci.internal / Dev@dmin123!</dd>
            </div>
            <div>
              <dt>Staff</dt>
              <dd>staff@oyci.internal / St@ff123!</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  )
}
