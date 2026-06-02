import { useEffect, useMemo, useState } from 'react'
import { AppShell } from './app/layout/AppShell'
import { ALL_ROUTES, DEFAULT_PROTECTED_ROUTE } from './app/routes/routeConfig'
import type { AppRoute } from './app/routes/routeConfig'
import { canAccessRoute } from './app/security/permissions'
import type { AuthStatus, Role } from './app/types/auth'
import { LoginPage } from './features/auth/pages/LoginPage'
import { ApiError, apiCall, authAPI } from './services/api'
import { useAuth } from './services/auth.context'
import './App.css'

function AppContent() {
  const { token, user, logout } = useAuth()
  const [authStatus, setAuthStatus] = useState<AuthStatus>('unknown')
  const [activePath, setActivePath] = useState<string>(DEFAULT_PROTECTED_ROUTE)
  const [apiStatus, setApiStatus] = useState<string>('testing...')
  const currentRole: Role = user?.role ?? 'staff'

  useEffect(() => {
    let cancelled = false

    // Test backend connection
    apiCall('/health')
      .then((data) => {
        if (!cancelled) {
          setApiStatus(`✓ Backend connected: ${data.status}`)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setApiStatus(`✗ Backend error: ${err.message}`)
        }
      })

    const syncAuthState = async () => {
      if (!token || !user) {
        if (!cancelled) {
          setAuthStatus('unauthenticated')
        }
        return
      }

      try {
        await authAPI.me(token)
        if (!cancelled) {
          setAuthStatus('authenticated')
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        if (err instanceof ApiError && err.status === 401) {
          logout()
          setAuthStatus('expired')
          return
        }

        setAuthStatus('unauthenticated')
      }
    }

    void syncAuthState()

    return () => {
      cancelled = true
    }
  }, [token, user, logout])

  const activeRoute = useMemo<AppRoute>(() => {
    const matched = ALL_ROUTES.find((route) => route.path === activePath)

    return matched ?? ALL_ROUTES[0]
  }, [activePath])

  if (authStatus === 'unknown') {
    return (
      <main className="app-status">
        <h1>Staff Scheduling Platform</h1>
        <p>Checking authentication status...</p>
        <p style={{ fontSize: '0.9em', color: '#666' }}>{apiStatus}</p>
      </main>
    )
  }

  if (authStatus === 'unauthenticated' || authStatus === 'expired') {
    return (
      <LoginPage
        isSessionExpired={authStatus === 'expired'}
        onLogin={() => {
          setActivePath(DEFAULT_PROTECTED_ROUTE)
        }}
      />
    )
  }

  const accessCheck = canAccessRoute(activeRoute, currentRole, authStatus)
  const routeToRender = accessCheck.allowed
    ? activeRoute
    : ALL_ROUTES.find((route) => route.path === DEFAULT_PROTECTED_ROUTE) ?? activeRoute

  return (
    <AppShell
      routes={ALL_ROUTES}
      activePath={routeToRender.path}
      role={currentRole}
      authStatus={authStatus}
      onNavigate={setActivePath}
      onLogout={() => setAuthStatus('expired')}
      routeAccessMessage={accessCheck.allowed ? undefined : accessCheck.message}
    />
  )
}

export default function App() {
  return (
    <AppContent/>
  )
}
