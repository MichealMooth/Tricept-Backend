/**
 * AddMemberDialog Component
 *
 * Dialog for adding a new member to a team.
 * Features: employee search combobox, role selection, filters out existing members.
 *
 * Task Group 3.5
 */

import { useEffect, useState, useMemo } from 'react'
import { listEmployees, type Employee } from '@/services/employee.service'
import { ADMIN_TEAM_ROLES, type TeamRole, type AddTeamMemberInput } from '@/types/team'

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
  USER: 'User',
}

export interface AddMemberDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AddTeamMemberInput) => Promise<void>
  existingMemberIds: string[]
}

export function AddMemberDialog(props: AddMemberDialogProps) {
  const { open, onClose, onSubmit, existingMemberIds } = props

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedRole, setSelectedRole] = useState<TeamRole>('VIEWER')
  const [submitting, setSubmitting] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Load employees on open
  useEffect(() => {
    if (!open) return
    const loadEmployees = async () => {
      setLoading(true)
      try {
        const data = await listEmployees()
        setEmployees(data)
      } catch (error) {
        console.error('Failed to load employees:', error)
      } finally {
        setLoading(false)
      }
    }
    void loadEmployees()
  }, [open])

  // Filter out existing members and apply search
  const availableEmployees = useMemo(() => {
    const filtered = employees.filter((e) => !existingMemberIds.includes(e.id))
    if (!search.trim()) return filtered
    const searchLower = search.toLowerCase()
    return filtered.filter(
      (e) =>
        e.firstName.toLowerCase().includes(searchLower) ||
        e.lastName.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower)
    )
  }, [employees, existingMemberIds, search])

  const handleSubmit = async () => {
    if (!selectedEmployee) return
    setSubmitting(true)
    try {
      await onSubmit({
        employeeId: selectedEmployee.id,
        role: selectedRole,
      })
      // Reset state
      setSelectedEmployee(null)
      setSelectedRole('VIEWER')
      setSearch('')
    } catch (error) {
      console.error('Failed to add member:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSearch(`${employee.firstName} ${employee.lastName}`)
    setDropdownOpen(false)
  }

  const handleSearchFocus = () => {
    setDropdownOpen(true)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setSelectedEmployee(null)
    setDropdownOpen(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Mitglied hinzufuegen</h3>

        <div className="space-y-4">
          {/* Employee Combobox */}
          <div className="relative">
            <label htmlFor="employee-search" className="mb-1 block text-sm font-medium">
              Mitarbeiter
            </label>
            <input
              id="employee-search"
              type="text"
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-controls="employee-listbox"
              aria-autocomplete="list"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder="Mitarbeiter suchen..."
              className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {dropdownOpen && (
              <div
                id="employee-listbox"
                role="listbox"
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow-lg"
              >
                {loading && (
                  <div className="px-3 py-2 text-sm text-gray-500">Lade...</div>
                )}
                {!loading && availableEmployees.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Keine Mitarbeiter verfuegbar
                  </div>
                )}
                {!loading &&
                  availableEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      role="option"
                      aria-selected={selectedEmployee?.id === employee.id}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                        selectedEmployee?.id === employee.id ? 'bg-indigo-100' : ''
                      }`}
                      onClick={() => handleSelectEmployee(employee)}
                    >
                      <div className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{employee.email}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Role Select */}
          <div>
            <label htmlFor="role-select" className="mb-1 block text-sm font-medium">
              Rolle
            </label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
              className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ADMIN_TEAM_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!selectedEmployee || submitting}
            className="rounded bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleSubmit}
          >
            {submitting ? 'Hinzufuegen...' : 'Hinzufuegen'}
          </button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  )
}
