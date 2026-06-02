import type { StaffMember } from './rota.types'
import { MOCK_SKILLS } from './mockSkills'

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    first_name: 'Alice',
    last_name: 'Henderson',
    email: 'alice.henderson@oyci.internal',
    contract_type: 'salaried',
    contracted_hours_per_week: 37.5,
    skills: [MOCK_SKILLS[0], MOCK_SKILLS[1], MOCK_SKILLS[2]], // First Aid, Youth Work, Safeguarding
    is_active: true,
  },
  {
    id: 'staff-2',
    first_name: 'Bob',
    last_name: 'Mackenzie',
    email: 'bob.mackenzie@oyci.internal',
    contract_type: 'sessional',
    contracted_hours_per_week: null,
    skills: [MOCK_SKILLS[0], MOCK_SKILLS[4]], // First Aid, Sports Leadership
    is_active: true,
  },
  {
    id: 'staff-3',
    first_name: 'Cara',
    last_name: 'Drummond',
    email: 'cara.drummond@oyci.internal',
    contract_type: 'salaried',
    contracted_hours_per_week: 30,
    skills: [MOCK_SKILLS[1], MOCK_SKILLS[2], MOCK_SKILLS[3]], // Youth Work, Safeguarding, Employability
    is_active: true,
  },
  {
    id: 'staff-4',
    first_name: 'Derek',
    last_name: 'Fraser',
    email: 'derek.fraser@oyci.internal',
    contract_type: 'sessional',
    contracted_hours_per_week: null,
    skills: [MOCK_SKILLS[0], MOCK_SKILLS[1]], // First Aid, Youth Work
    is_active: true,
  },
  {
    id: 'staff-5',
    first_name: 'Emma',
    last_name: 'Stirling',
    email: 'emma.stirling@oyci.internal',
    contract_type: 'salaried',
    contracted_hours_per_week: 37.5,
    skills: [MOCK_SKILLS[1], MOCK_SKILLS[2], MOCK_SKILLS[3], MOCK_SKILLS[4]], // Youth Work, Safeguarding, Employability, Sports
    is_active: true,
  },
]
