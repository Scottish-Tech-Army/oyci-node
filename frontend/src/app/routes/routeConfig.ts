import type { Role } from '../types/auth'

export type AppRouteSection = 'shared' | 'operations' | 'admin'

export type AppRoute = {
  path: string
  label: string
  section: AppRouteSection
  allowedRoles: Role[]
  description: string
}

export const DEFAULT_PROTECTED_ROUTE = '/calendar'

export const ALL_ROUTES: AppRoute[] = [
  {
    path: '/calendar',
    label: 'Calendar',
    section: 'shared',
    allowedRoles: ['admin', 'staff'],
    description: 'Monthly calendar view of sessions and events with schedule visibility.',
  },
  {
    path: '/leave',
    label: 'Leave Management',
    section: 'shared',
    allowedRoles: ['admin', 'staff'],
    description: 'Plan leave, review team availability, and navigate leave by month.',
  },
  {
    path: '/rota',
    label: 'Rota Planner',
    section: 'operations',
    allowedRoles: ['admin'],
    description: 'Plan staffing assignments for programme sessions.',
  },
  {
    path: '/sessions',
    label: 'Sessions',
    section: 'operations',
    allowedRoles: ['admin'],
    description: 'View and manage scheduled sessions and staffing needs.',
  },
  {
    path: '/staff',
    label: 'Staff',
    section: 'operations',
    allowedRoles: ['admin'],
    description: 'Review staff profiles, skills, and availability status.',
  },
  {
    path: '/reporting',
    label: 'Reporting',
    section: 'shared',
    allowedRoles: ['admin'],
    description: 'Review event history and staffing coverage summaries.',
  },
  {
    path: '/admin/users',
    label: 'User Management',
    section: 'admin',
    allowedRoles: ['admin'],
    description: 'Admin-only account controls and role management.',
  },
  {
    path: '/my-account',
    label: 'My Account',
    section: 'shared',
    allowedRoles: ['admin', 'staff'],
    description: 'View account profile and role information.',
  },
]
