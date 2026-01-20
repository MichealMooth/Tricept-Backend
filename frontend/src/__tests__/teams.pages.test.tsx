/**
 * Team Admin Pages Tests
 *
 * Tests for TeamsPage, TeamDetailPage, TeamForm, and AddMemberDialog components.
 * Task Group 3.1
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import TeamsPage from '@/pages/admin/TeamsPage'
import TeamDetailPage from '@/pages/admin/TeamDetailPage'
import { TeamForm } from '@/components/admin/TeamForm'
import { AddMemberDialog } from '@/components/admin/AddMemberDialog'

// Mock the team service
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

// Mock the employee service
vi.mock('@/services/employee.service', () => ({
  listEmployees: vi.fn(),
}))

// Import mocked modules
import * as teamService from '@/services/team.service'
import * as employeeService from '@/services/employee.service'

const mockTeams = {
  items: [
    { id: '1', name: 'Team Alpha', description: 'Alpha desc', isActive: true, memberCount: 5, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: null, updatedBy: null },
    { id: '2', name: 'Team Beta', description: 'Beta desc', isActive: false, memberCount: 3, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: null, updatedBy: null },
    { id: '3', name: 'Development', description: 'Dev team', isActive: true, memberCount: 8, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: null, updatedBy: null },
  ],
  total: 3,
  page: 1,
  pageSize: 10,
}

const mockTeam = {
  id: '1',
  name: 'Team Alpha',
  description: 'Alpha description',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  createdBy: null,
  updatedBy: null,
}

const mockMembers = {
  items: [
    { id: 'm1', employeeId: 'e1', role: 'OWNER' as const, createdAt: '2024-01-01', employee: { id: 'e1', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com' } },
    { id: 'm2', employeeId: 'e2', role: 'EDITOR' as const, createdAt: '2024-01-01', employee: { id: 'e2', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@example.com' } },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
}

const mockEmployees = [
  { id: 'e1', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', role: null, department: 'IT', isActive: true, isAdmin: false, hireDate: null, createdAt: '2024-01-01' },
  { id: 'e2', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@example.com', role: null, department: 'IT', isActive: true, isAdmin: false, hireDate: null, createdAt: '2024-01-01' },
  { id: 'e3', firstName: 'Peter', lastName: 'Mueller', email: 'peter@example.com', role: null, department: 'IT', isActive: true, isAdmin: false, hireDate: null, createdAt: '2024-01-01' },
]

describe('TeamsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(teamService.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue(mockTeams)
  })

  it('renders team list table with correct columns', async () => {
    render(
      <BrowserRouter>
        <TeamsPage />
      </BrowserRouter>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    })

    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Mitglieder')).toBeInTheDocument()

    // Check team data is displayed
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
  })

  it('search input calls listTeams with search parameter after debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    render(
      <BrowserRouter>
        <TeamsPage />
      </BrowserRouter>
    )

    // Wait for initial render
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    // Clear the mock to track new calls
    ;(teamService.listTeams as ReturnType<typeof vi.fn>).mockClear()

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Suchen...')
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Alpha' } })
    })

    // Advance timers by 300ms+ (debounce time)
    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    // Verify listTeams was called with search parameter
    await waitFor(() => {
      const calls = (teamService.listTeams as ReturnType<typeof vi.fn>).mock.calls
      const searchCall = calls.find((call: unknown[]) =>
        call[0] && typeof call[0] === 'object' && (call[0] as { search?: string }).search === 'Alpha'
      )
      expect(searchCall).toBeDefined()
    })

    vi.useRealTimers()
  })
})

describe('TeamDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(teamService.getTeam as ReturnType<typeof vi.fn>).mockResolvedValue(mockTeam)
    ;(teamService.getTeamMembers as ReturnType<typeof vi.fn>).mockResolvedValue(mockMembers)
  })

  it('renders team info and member table', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/teams/1']}>
        <Routes>
          <Route path="/admin/teams/:teamId" element={<TeamDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for team data to load
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    })

    // Check team description
    expect(screen.getByText('Alpha description')).toBeInTheDocument()

    // Check member table
    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
      expect(screen.getByText('Anna Schmidt')).toBeInTheDocument()
    })

    // Check member emails are displayed
    expect(screen.getByText('max@example.com')).toBeInTheDocument()
    expect(screen.getByText('anna@example.com')).toBeInTheDocument()
  })
})

describe('TeamForm', () => {
  it('validates required fields (name)', async () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(
      <TeamForm
        mode="create"
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    )

    // Try to submit without filling name
    const submitButton = screen.getByRole('button', { name: /anlegen/i })
    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Form should not be submitted
    expect(onSubmit).not.toHaveBeenCalled()

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/name ist erforderlich/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onCancel = vi.fn()

    render(
      <TeamForm
        mode="create"
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    )

    // Fill in the name field
    const nameInput = screen.getByLabelText(/name/i)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Team' } })
    })

    // Fill in optional description
    const descInput = screen.getByLabelText(/beschreibung/i)
    await act(async () => {
      fireEvent.change(descInput, { target: { value: 'Team description' } })
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /anlegen/i })
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Team',
        description: 'Team description',
      })
    })
  })
})

describe('AddMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(employeeService.listEmployees as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployees)
  })

  it('filters employees in combobox and excludes already assigned', async () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    // e1 and e2 are already members
    const existingMemberIds = ['e1', 'e2']

    render(
      <AddMemberDialog
        open={true}
        onClose={onCancel}
        onSubmit={onSubmit}
        existingMemberIds={existingMemberIds}
      />
    )

    // Wait for employees to load
    await waitFor(() => {
      expect(employeeService.listEmployees).toHaveBeenCalled()
    })

    // Find the employee search input by its id
    const employeeSearchInput = screen.getByPlaceholderText('Mitarbeiter suchen...')
    await act(async () => {
      fireEvent.focus(employeeSearchInput)
    })

    // Only Peter Mueller should be available (e3) - check for option buttons
    await waitFor(() => {
      const peterOption = screen.getByRole('option', { name: /peter mueller/i })
      expect(peterOption).toBeInTheDocument()
    })

    // Max and Anna should not be in the dropdown (already assigned)
    expect(screen.queryByRole('option', { name: /max mustermann/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /anna schmidt/i })).not.toBeInTheDocument()
  })
})
