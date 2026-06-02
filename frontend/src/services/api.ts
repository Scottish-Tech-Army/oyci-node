export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const apiCall = async (endpoint: string, options?: RequestInit & { token?: string }) => {
  const { token, ...requestOptions } = options || {}

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...requestOptions?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    let message = `API Error: ${response.status}`
    let code: string | undefined

    try {
      const errorBody = await response.json()
      if (typeof errorBody?.error === 'string') {
        message = errorBody.error
      }
      if (typeof errorBody?.code === 'string') {
        code = errorBody.code
      }
    } catch {
      // Ignore non-JSON error bodies and fall back to status-based messaging.
    }

    throw new ApiError(response.status, message, code)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const authAPI = {
  login: (email: string, password: string) =>
    apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    apiCall('/api/v1/auth/me', { method: 'GET', token }),

  changePassword: (data: { currentPassword: string; newPassword: string }, token: string) =>
    apiCall('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify(data), token }),
}

export const usersAPI = {
  create: (data: { email: string; password: string; roleId: 'role_admin' | 'role_staff' }, token: string) =>
    apiCall('/api/v1/users', { method: 'POST', body: JSON.stringify(data), token }),

  list: (token: string) =>
    apiCall('/api/v1/users', { method: 'GET', token }),

  resetPassword: (id: string, newPassword: string, token: string) =>
    apiCall(`/api/v1/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }), token }),
}

export type SkillType = 'standard' | 'mentoring' | 'workshop' | 'outreach'
export type ContractType = 'salaried' | 'sessional'

export type StaffMember = {
  id: string
  email: string
  role_id: string
  is_active: number
  created_at: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  contract_type: ContractType | null
  contracted_hours_per_week: number | null
  notes: string | null
  skills: SkillType[]
}

type CreateStaffPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | null
  contractType: ContractType
  contractedHoursPerWeek?: number | null
  skills?: SkillType[]
  notes?: string | null
}

type UpdateStaffPayload = {
  firstName?: string
  lastName?: string
  phone?: string | null
  contractType?: ContractType
  contractedHoursPerWeek?: number | null
  skills?: SkillType[]
  notes?: string | null
  isActive?: boolean
}

export const staffAPI = {
  list: (token: string) =>
    apiCall('/api/v1/staff', { method: 'GET', token }),

  create: (data: CreateStaffPayload, token: string) =>
    apiCall('/api/v1/staff', { method: 'POST', body: JSON.stringify(data), token }),

  update: (id: string, data: UpdateStaffPayload, token: string) =>
    apiCall(`/api/v1/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
}

type LeaveType = 'away' | 'sick'

type LeavePayload = {
  startDate: string
  endDate: string
  leaveType: LeaveType
  notes?: string | null
}

type LeaveListParams = {
  from?: string
  to?: string
}

export const leaveAPI = {
  list: (token: string, params?: LeaveListParams) => {
    const query = new URLSearchParams(
      Object.entries(params ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ).toString()

    const endpoint = query ? `/api/v1/leave?${query}` : '/api/v1/leave'
    return apiCall(endpoint, { method: 'GET', token })
  },

  create: (data: LeavePayload, token: string) =>
    apiCall('/api/v1/leave', { method: 'POST', body: JSON.stringify(data), token }),

  update: (id: string, data: LeavePayload, token: string) =>
    apiCall(`/api/v1/leave/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  remove: (id: string, token: string) =>
    apiCall(`/api/v1/leave/${id}`, { method: 'DELETE', token }),
}

type SessionsListParams = {
  from?: string
  to?: string
  sessionType?: 'standard' | 'mentoring' | 'workshop' | 'outreach'
}

// ─── Session staffing compat note ─────────────────────────────────────────────
// The frontend domain concept is "minimum staff required" (minStaffRequired).
// The current backend session schema stores this as `attendees` because the
// dedicated `min_staff` column has not yet been added to the sessions table.
//
// Compatibility seam:
//   - Components set `minStaffRequired` when creating/updating sessions.
//   - The API helpers translate `minStaffRequired` → `attendees` in the request
//     body so the current backend still accepts the value.
//   - When the backend team adds `min_staff` to the sessions table and returns
//     it in responses, update only the mapper below — no component changes needed.
//
// TODO(backend-min-staff): once the sessions table has a real `min_staff` column:
//   1. Replace `attendees` with `min_staff` in ScheduledSessionPayload.
//   2. Remove the `minStaffRequired → attendees` translation in toBackendSessionPayload.
//   3. Update `sessionsAPI.list` response normalization in rota.api.ts.
// ──────────────────────────────────────────────────────────────────────────────

type ScheduledSessionPayload = {
  title: string
  description?: string | null
  startTime: string
  endTime: string
  location?: string | null
  sessionType: 'standard' | 'mentoring' | 'workshop' | 'outreach'
  notes?: string | null
  /** Minimum staff required for this session. Serialized as `attendees` for
   *  current backend compat — see compat note above. */
  minStaffRequired?: number | null
  /** @deprecated use minStaffRequired. Kept for direct backend pass-through where needed. */
  attendees?: number | null
  staffUserIds?: string[]
}

type UpdateScheduledSessionPayload = Partial<ScheduledSessionPayload>

type UnscheduledSessionPayload = {
  title: string
  description?: string | null
  location?: string | null
  sessionType: 'standard' | 'mentoring' | 'workshop' | 'outreach'
  notes?: string | null
  /** Minimum staff required for this session. Serialized as `attendees` for
   *  current backend compat — see compat note above. */
  minStaffRequired?: number | null
  /** @deprecated use minStaffRequired. Kept for direct backend pass-through where needed. */
  attendees?: number | null
}

/** Translate the frontend staffing field to the current backend wire format.
 *  Remove the minStaffRequired→attendees mapping once the backend has a dedicated min_staff column. */
function toBackendSessionPayload<T extends { minStaffRequired?: number | null; attendees?: number | null }>(
  payload: T,
): Omit<T, 'minStaffRequired'> & { attendees?: number | null } {
  const { minStaffRequired, ...rest } = payload
  return {
    ...rest,
    // Prefer an explicit `attendees` override; otherwise map minStaffRequired.
    attendees: rest.attendees !== undefined ? rest.attendees : (minStaffRequired ?? null),
  }
}

export const sessionsAPI = {
  list: (token: string, params?: SessionsListParams) => {
    const query = new URLSearchParams(
      Object.entries(params ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ).toString()

    const endpoint = query ? `/api/v1/sessions?${query}` : '/api/v1/sessions'
    return apiCall(endpoint, { method: 'GET', token })
  },

  get: (sessionId: string, token: string) =>
    apiCall(`/api/v1/sessions/${sessionId}`, { method: 'GET', token }),

  create: (data: ScheduledSessionPayload, token: string) =>
    apiCall('/api/v1/sessions', { method: 'POST', body: JSON.stringify(toBackendSessionPayload(data)), token }),

  update: (sessionId: string, data: UpdateScheduledSessionPayload, token: string) =>
    apiCall(`/api/v1/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify(toBackendSessionPayload(data)), token }),

  createUnscheduled: (data: UnscheduledSessionPayload, token: string) =>
    apiCall('/api/v1/sessions', { method: 'POST', body: JSON.stringify(toBackendSessionPayload(data)), token }),

  unscheduled: (token: string) =>
    apiCall('/api/v1/sessions/unscheduled', { method: 'GET', token }),

  schedule: (
    sessionId: string,
    data: { sessionDate: string; startTime: string; endTime: string },
    token: string,
  ) => apiCall(`/api/v1/sessions/${sessionId}/schedule`, { method: 'PATCH', body: JSON.stringify(data), token }),

  unschedule: (sessionId: string, token: string) =>
    apiCall(`/api/v1/sessions/${sessionId}/unschedule`, { method: 'PATCH', token }),

  eligibleStaff: (
    params: { startTime?: string; endTime?: string; sessionType: 'standard' | 'mentoring' | 'workshop' | 'outreach' },
    token: string,
  ) => {
    const query = new URLSearchParams(params).toString()
    return apiCall(`/api/v1/sessions/eligible-staff/options?${query}`, { method: 'GET', token })
  },
}