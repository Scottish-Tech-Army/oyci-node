import type { AvailabilityRecord } from './rota.types'

// Staff availability records (holidays, sickness, etc.)
// Staff with records covering a session date will be hidden from the allocation modal.
export const MOCK_AVAILABILITY: AvailabilityRecord[] = [
  {
    id: 'avail-1',
    staff_id: 'staff-2', // Bob Mackenzie on holiday week 2
    type: 'holiday',
    start_date: '2026-07-13',
    end_date: '2026-07-17',
  },
  {
    id: 'avail-2',
    staff_id: 'staff-4', // Derek Fraser — sickness
    type: 'sickness',
    start_date: '2026-07-06',
    end_date: '2026-07-10',
  },
]
