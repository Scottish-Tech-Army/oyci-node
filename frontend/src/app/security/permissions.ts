import type { AppRoute } from '../routes/routeConfig'
import type { AuthStatus, Role } from '../types/auth'

export type AccessCheckResult = {
  allowed: boolean
  message?: string
}

export function canAccessRoute(
  route: AppRoute,
  role: Role,
  authStatus: AuthStatus,
): AccessCheckResult {
  if (authStatus !== 'authenticated') {
    return {
      allowed: false,
      message: 'Please log in to access protected routes.',
    }
  }

  if (!route.allowedRoles.includes(role)) {
    return {
      allowed: false,
      message: 'You do not have permission to view that section.',
    }
  }

  return { allowed: true }
}
