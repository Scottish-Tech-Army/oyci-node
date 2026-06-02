import type { JSX } from 'react'
import type { AppRoute } from '../routes/routeConfig'
import type { AuthStatus, Role } from '../types/auth'
import { canAccessRoute } from '../security/permissions'
import { UserManagementPage } from '../../features/admin/pages/UserManagementPage'
import { CalendarPage } from '../../features/calendar/pages/CalendarPage'
import { LeaveManagementPage } from '../../features/leave/pages/LeaveManagementPage'
import { MyAccountPage } from '../../features/account/pages/MyAccountPage'
import { RotaPlannerPage } from '../../features/rota/pages/RotaPlannerPage'
import { SessionsPage } from '../../features/sessions/pages/SessionsPage'
import { StaffPage } from '../../features/staff/pages/StaffPage'
import { useAuth } from '../../services/auth.context'
import oyciLogo from '../../../OYCI-Logo.png'
import { PageHeader } from './PageHeader'

type AppShellProps = {
  routes: AppRoute[]
  activePath: string
  role: Role
  authStatus: AuthStatus
  routeAccessMessage?: string
  onNavigate: (path: string) => void
  onLogout: () => void
}

function sectionTitle(section: AppRoute['section']) {
  if (section === 'operations') return 'Operations workspace'
  if (section === 'admin') return 'Administration'
  return 'Shared overview'
}

function routeGlyph(path: string) {
  if (path === '/calendar') return 'Ca'
  if (path === '/rota') return 'Ro'
  if (path === '/sessions') return 'Se'
  if (path === '/staff') return 'St'
  if (path === '/reporting') return 'Rp'
  if (path === '/admin/users') return 'Ad'
  return 'Me'
}

function routeBadge(route: AppRoute, role: Role) {
  if (route.allowedRoles.length === 1 && route.allowedRoles[0] === 'admin') {
    return 'Admin only'
  }

  return role === 'admin' ? 'Admin view' : 'Staff view'
}

const ROUTE_PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  '/calendar': () => <CalendarPage />,
  '/leave': () => <LeaveManagementPage />,
  '/rota': () => <RotaPlannerPage />,
  '/sessions': () => <SessionsPage />,
  '/staff': () => <StaffPage />,
  '/admin/users': () => <UserManagementPage />,
  '/my-account': () => <MyAccountPage />,
}

export function AppShell({
  routes,
  activePath,
  role,
  authStatus,
  routeAccessMessage,
  onNavigate,
  onLogout,
}: AppShellProps) {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const visibleRoutes = routes.filter((route) => canAccessRoute(route, role, authStatus).allowed)
  const activeRoute = routes.find((route) => route.path === activePath) ?? visibleRoutes[0]
  const ActivePage = activeRoute ? ROUTE_PAGE_COMPONENTS[activeRoute.path] : undefined
  const groupedRoutes = visibleRoutes.reduce<Record<string, AppRoute[]>>((accumulator, route) => {
    const key = route.section

    if (!accumulator[key]) {
      accumulator[key] = []
    }

    accumulator[key].push(route)
    return accumulator
  }, {})

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <img className="app-header__logo" src={oyciLogo} alt="" />
          <div className="app-header__copy">
            <p className="app-header__eyebrow">Ochil Youth Community Improvement</p>
            <p className="app-header__org">OYCI operations platform</p>
            <p className="header-subtitle">Practical rota, calendar and session coordination for internal staff teams</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-role-pill">Role: {role === 'admin' ? 'Admin' : 'Standard Staff'}</span>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar" aria-label="Primary navigation">
          {(['shared', 'operations', 'admin'] as const).map((section) => {
            const sectionRoutes = groupedRoutes[section]
            if (!sectionRoutes || sectionRoutes.length === 0) {
              return null
            }

            return (
              <section key={section} className="nav-section">
                <h2>{sectionTitle(section)}</h2>
                <ul>
                  {sectionRoutes.map((route) => {
                    const isActive = route.path === activePath

                    return (
                      <li key={route.path}>
                        <button
                          type="button"
                          className={isActive ? 'nav-link active' : 'nav-link'}
                          onClick={() => onNavigate(route.path)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {route.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </aside>

        <main className="app-main">
          {activeRoute ? (
            <>
              <PageHeader
                eyebrow={sectionTitle(activeRoute.section)}
                title={activeRoute.label}
                description={activeRoute.description}
                roleBadge={routeBadge(activeRoute, role)}
                icon={<span className="page-header__icon-mark">{routeGlyph(activeRoute.path)}</span>}
              />

              {routeAccessMessage ? <p className="warning-banner">{routeAccessMessage}</p> : null}

              <section className="page-panel" aria-live="polite">
                {ActivePage ? (
                  <div className="page-panel__content">
                    <ActivePage />
                  </div>
                ) : (
                  <div className="placeholder-grid">
                    <article>
                      <h2>Page scaffold ready</h2>
                      <p>Feature modules will be added in later phases.</p>
                    </article>
                    <article>
                      <h2>Route path</h2>
                      <p>
                        <code>{activeRoute.path}</code>
                      </p>
                    </article>
                    <article>
                      <h2>Access</h2>
                      <p>Visible to {activeRoute.allowedRoles.join(', ')} role(s).</p>
                    </article>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="page-panel">
              <h1>No routes available</h1>
              <p>Check role and auth configuration.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
