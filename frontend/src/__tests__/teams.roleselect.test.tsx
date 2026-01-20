/**
 * RoleSelect Component Tests
 *
 * Tests for RoleSelect component functionality.
 * Task Group 5.3: Strategic tests for critical gaps
 *
 * Tests (5 tests total, consolidated):
 * 1. RoleSelect renders correctly with all admin roles
 * 2. RoleSelect calls API and updates on role change
 * 3. RoleSelect handles errors by reverting to original role
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoleSelect } from '@/components/admin/RoleSelect'

// Mock the team service
vi.mock('@/services/team.service', () => ({
  updateMemberRole: vi.fn(),
}))

import * as teamService from '@/services/team.service'

describe('RoleSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with current role selected and all admin roles as options', () => {
    render(
      <RoleSelect
        membershipId="m1"
        currentRole="EDITOR"
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('EDITOR')

    // Check all admin roles are present (excluding USER)
    expect(screen.getByRole('option', { name: 'Owner' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Editor' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Viewer' })).toBeInTheDocument()
  })

  it('calls updateMemberRole API on role change and updates UI', async () => {
    ;(teamService.updateMemberRole as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'm1',
      role: 'ADMIN',
    })

    const onRoleChange = vi.fn()

    render(
      <RoleSelect
        membershipId="m1"
        currentRole="EDITOR"
        onRoleChange={onRoleChange}
      />
    )

    const select = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(select, { target: { value: 'ADMIN' } })
    })

    await waitFor(() => {
      expect(teamService.updateMemberRole).toHaveBeenCalledWith('m1', 'ADMIN')
    })

    expect(onRoleChange).toHaveBeenCalled()
    expect(select).toHaveValue('ADMIN')
  })

  it('does not call API when selecting same role', async () => {
    render(
      <RoleSelect
        membershipId="m1"
        currentRole="EDITOR"
      />
    )

    const select = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(select, { target: { value: 'EDITOR' } })
    })

    expect(teamService.updateMemberRole).not.toHaveBeenCalled()
  })

  it('reverts to original role on API error', async () => {
    ;(teamService.updateMemberRole as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update failed')
    )

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RoleSelect
        membershipId="m1"
        currentRole="EDITOR"
      />
    )

    const select = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(select, { target: { value: 'ADMIN' } })
    })

    await waitFor(() => {
      expect(select).toHaveValue('EDITOR')
    })

    consoleErrorSpy.mockRestore()
  })
})
