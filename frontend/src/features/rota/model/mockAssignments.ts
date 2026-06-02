import type { Assignment } from './rota.types'

// Pre-seeded assignments for the demo scheduled sessions
export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-1',
    session_id: 'session-6',
    staff_id: 'staff-1', // Alice Henderson
    status: 'confirmed',
  },
  {
    id: 'assign-2',
    session_id: 'session-7',
    staff_id: 'staff-5', // Emma Stirling
    status: 'confirmed',
  },
]
