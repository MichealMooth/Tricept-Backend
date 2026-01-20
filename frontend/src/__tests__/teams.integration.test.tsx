/**
 * Teams Integration Tests
 *
 * Tests for TeamBadges component, EmployeeForm team multi-select,
 * and EmployeesPage team column integration.
 *
 * Task Group 4.1
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { TeamBadges } from '@/components/TeamBadges'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import EmployeesPage from '@/pages/admin/EmployeesPage'

// Mock the services
vi.mock('@/services/employee.service', () => ({
  listEmployees: vi.fn(),
  listEmployeesWithTeams: vi.fn(),
  getEmployeeTeams: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  archiveEmployee: vi.fn(),
}))

vi.mock('@/services/team.service', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deactivateTeam: vi.fn(),
  activateTeam: vi.fn(),
  getTeamMembers: vi.fn(),
  addTeamMember: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}))

// Import mocked modules
import * as employeeService from '@/services/employee.service'
import * as teamService from '@/services/team.service'

const mockEmployeesWithTeams = [
  {
    id: 'e1',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@example.com',
    role: 'Developer',
    department: 'IT',
    isActive: true,
    isAdmin: false,
    hireDate: null,
    createdAt: '2024-01-01',
    teams: [
      { id: 't1', name: 'Team Alpha' },
      { id: 't2', name: 'Team Beta' },
    ],
  },
  {
    id: 'e2',
    firstName: 'Anna',
    lastName: 'Schmidt',
    email: 'anna@example.com',
    role: 'Designer',
    department: 'UX',
    isActive: true,
    isAdmin: false,
    hireDate: null,
    createdAt: '2024-01-01',
    teams: [
      { id: 't1', name: 'Team Alpha' },
      { id: 't3', name: 'Team Gamma' },
      { id: 't4', name: 'Team Delta' },
      { id: 't5', name: 'Team Epsilon' },
    ],
  },
]

const mockTeams = {
  items: [
    { id: 't1', name: 'Team Alpha', description: 'Alpha desc', isActive: true, memberCount: 5, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: null, updatedBy: null },
    { id: 't2', name: 'Team Beta', description: 'Beta desc', isActive: true, memberCount: 3, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: null, updatedBy: null },
    { id: 't3', name: 'Team Gamma', description: 'Gamma desc', isActive: true, memberCount: 2, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: null, updatedBy: null },
  ],
  total: 3,
  page: 1,
  pageSize: 10,
}

const mockEmployeeTeams = [
  { teamId: 't1', teamName: 'Team Alpha', role: 'EDITOR' as const, membershipId: 'm1' },
  { teamId: 't2', teamName: 'Team Beta', role: 'VIEWER' as const, membershipId: 'm2' },
]

describe('TeamBadges', () => {
  it('renders team tags correctly', () => {
    const teams = [
      { id: 't1', name: 'Team Alpha' },
      { id: 't2', name: 'Team Beta' },
    ]

    render(<TeamBadges teams={teams} />)

    expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
  })

  it('shows "+N" badge for overflow teams (more than 2)', () => {
    const teams = [
      { id: 't1', name: 'Team Alpha' },
      { id: 't2', name: 'Team Beta' },
      { id: 't3', name: 'Team Gamma' },
      { id: 't4', name: 'Team Delta' },
    ]

    render(<TeamBadges teams={teams} />)

    // First two teams should be visible
    expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    expect(screen.getByText('Team Beta')).toBeInTheDocument()

    // Third and fourth teams should not be directly visible
    expect(screen.queryByText('Team Gamma')).not.toBeInTheDocument()
    expect(screen.queryByText('Team Delta')).not.toBeInTheDocument()

    // Should show +2 overflow badge
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders empty state when no teams', () => {
    render(<TeamBadges teams={[]} />)

    // Should show a dash or nothing when no teams
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})

describe('EmployeeForm team multi-select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(teamService.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue(mockTeams)
    ;(employeeService.getEmployeeTeams as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployeeTeams)
  })

  it('displays team multi-select in edit mode with current assignments', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const onCancel = vi.fn()

    render(
      <EmployeeForm
        mode="edit"
        employeeId="e1"
        initial={{
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max@example.com',
          role: 'Developer',
          department: 'IT',
          isAdmin: false,
          isActive: true,
        }}
        onCancel={onCancel}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />
    )

    // Wait for teams to load
    await waitFor(() => {
      expect(screen.getByText('Team-Zuordnungen')).toBeInTheDocument()
    })

    // Should show current team assignments
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
      expect(screen.getByText('Team Beta')).toBeInTheDocument()
    })
  })
})

describe('EmployeesPage team column', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(employeeService.listEmployeesWithTeams as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployeesWithTeams)
    ;(employeeService.listEmployees as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployeesWithTeams)
  })

  it('displays TeamBadges column in employee table', async () => {
    render(
      <BrowserRouter>
        <EmployeesPage />
      </BrowserRouter>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Mustermann, Max')).toBeInTheDocument()
    })

    // Check for Teams column header
    expect(screen.getByText('Teams')).toBeInTheDocument()

    // Check that TeamBadges are displayed for employees
    // Both Max and Anna have Team Alpha, so we should find multiple instances
    const teamAlphaElements = screen.getAllByText('Team Alpha')
    expect(teamAlphaElements.length).toBeGreaterThanOrEqual(1)

    // Max has Team Beta, only one instance
    expect(screen.getByText('Team Beta')).toBeInTheDocument()

    // Anna has 4 teams, should show +2 overflow
    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument()
    })
  })
})
