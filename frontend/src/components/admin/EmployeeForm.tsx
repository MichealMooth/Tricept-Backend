/**
 * EmployeeForm Component
 *
 * Form for creating and editing employees.
 * Task Group 4.4: Extended with team assignment multi-select and per-team role selection.
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getEmployeeTeams, type EmployeeTeam } from '@/services/employee.service'
import { listTeams, addTeamMember, updateMemberRole, removeMember } from '@/services/team.service'
import { ADMIN_TEAM_ROLES, type TeamRole, type TeamWithMemberCount } from '@/types/team'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(10).optional(), // only required on create
  role: z.string().optional(),
  department: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hireDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
  USER: 'User',
}

export interface EmployeeFormProps {
  mode: 'create' | 'edit'
  employeeId?: string
  initial?: Partial<FormValues>
  onCancel: () => void
  onCreate: (data: Required<Pick<FormValues, 'email' | 'password' | 'firstName' | 'lastName'>> & Partial<FormValues>) => Promise<void>
  onUpdate: (data: Partial<FormValues>) => Promise<void>
  onTeamsChange?: () => void
}

export function EmployeeForm(props: EmployeeFormProps) {
  const { mode, employeeId, initial, onCancel, onCreate, onUpdate, onTeamsChange } = props

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // Team assignment state
  const [allTeams, setAllTeams] = useState<TeamWithMemberCount[]>([])
  const [employeeTeams, setEmployeeTeams] = useState<EmployeeTeam[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [teamSearchQuery, setTeamSearchQuery] = useState('')
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  const [updatingMembership, setUpdatingMembership] = useState<string | null>(null)

  // Load all teams and employee's current teams
  useEffect(() => {
    const loadTeamData = async () => {
      setLoadingTeams(true)
      try {
        const [teamsResponse, employeeTeamsData] = await Promise.all([
          listTeams({ includeInactive: false }),
          mode === 'edit' && employeeId ? getEmployeeTeams(employeeId) : Promise.resolve([])
        ])
        setAllTeams(teamsResponse.items)
        setEmployeeTeams(employeeTeamsData)
      } catch (error) {
        console.error('Failed to load team data:', error)
      } finally {
        setLoadingTeams(false)
      }
    }

    if (mode === 'edit') {
      void loadTeamData()
    }
  }, [mode, employeeId])

  useEffect(() => {
    reset({
      firstName: initial?.firstName ?? '',
      lastName: initial?.lastName ?? '',
      email: initial?.email ?? '',
      role: initial?.role ?? '',
      department: initial?.department ?? 'Consulting',
      isAdmin: initial?.isAdmin ?? false,
      isActive: initial?.isActive ?? true,
      hireDate: initial?.hireDate ?? '',
    })
  }, [initial, reset])

  const onSubmit = async (values: FormValues) => {
    if (mode === 'create') {
      if (!values.password) {
        return
      }
      await onCreate({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        department: values.department,
        isAdmin: values.isAdmin,
        isActive: values.isActive,
        hireDate: values.hireDate,
      })
    } else {
      await onUpdate(values)
    }
  }

  // Filter available teams (exclude already assigned)
  const availableTeams = allTeams.filter(
    (team) => !employeeTeams.some((et) => et.teamId === team.id)
  )

  const filteredAvailableTeams = availableTeams.filter((team) =>
    team.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  )

  // Handle adding a team membership
  const handleAddTeam = async (teamId: string) => {
    if (!employeeId) return
    setUpdatingMembership(teamId)
    try {
      await addTeamMember(teamId, {
        employeeId,
        role: 'VIEWER', // Default role
      })
      // Reload employee teams
      const updatedTeams = await getEmployeeTeams(employeeId)
      setEmployeeTeams(updatedTeams)
      setShowTeamDropdown(false)
      setTeamSearchQuery('')
      onTeamsChange?.()
    } catch (error) {
      console.error('Failed to add team membership:', error)
    } finally {
      setUpdatingMembership(null)
    }
  }

  // Handle removing a team membership
  const handleRemoveTeam = async (membershipId: string) => {
    if (!employeeId) return
    setUpdatingMembership(membershipId)
    try {
      await removeMember(membershipId)
      // Reload employee teams
      const updatedTeams = await getEmployeeTeams(employeeId)
      setEmployeeTeams(updatedTeams)
      onTeamsChange?.()
    } catch (error) {
      console.error('Failed to remove team membership:', error)
    } finally {
      setUpdatingMembership(null)
    }
  }

  // Handle updating a member's role
  const handleRoleChange = async (membershipId: string, newRole: TeamRole) => {
    setUpdatingMembership(membershipId)
    try {
      await updateMemberRole(membershipId, newRole)
      // Update local state
      setEmployeeTeams((prev) =>
        prev.map((et) =>
          et.membershipId === membershipId ? { ...et, role: newRole } : et
        )
      )
      onTeamsChange?.()
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setUpdatingMembership(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{mode === 'create' ? 'Mitarbeiter anlegen' : 'Mitarbeiter bearbeiten'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 grid-cols-2">
          <div className="col-span-1">
            <label className="block text-sm mb-1">Vorname</label>
            <input className="w-full border rounded px-3 py-2" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-sm mb-1">Nachname</label>
            <input className="w-full border rounded px-3 py-2" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">E-Mail</label>
            <input className="w-full border rounded px-3 py-2" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          {mode === 'create' && (
            <div className="col-span-2">
              <label className="block text-sm mb-1">Passwort</label>
              <input className="w-full border rounded px-3 py-2" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
          )}
          <div className="col-span-1">
            <label className="block text-sm mb-1">Rolle</label>
            <input className="w-full border rounded px-3 py-2" {...register('role')} />
          </div>
          <div className="col-span-1">
            <label className="block text-sm mb-1">Abteilung</label>
            <input className="w-full border rounded px-3 py-2" {...register('department')} />
          </div>
          <div className="col-span-1">
            <label className="block text-sm mb-1">Eintrittsdatum</label>
            <input className="w-full border rounded px-3 py-2" type="date" {...register('hireDate')} />
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <input type="checkbox" {...register('isAdmin')} />
            <span>Admin</span>
          </div>

          {/* Team Assignment Section (only in edit mode) */}
          {mode === 'edit' && (
            <div className="col-span-2 mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Team-Zuordnungen</h4>

              {loadingTeams ? (
                <div className="text-sm text-gray-500">Lade Teams...</div>
              ) : (
                <>
                  {/* Current Team Assignments */}
                  {employeeTeams.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {employeeTeams.map((team) => (
                        <div
                          key={team.membershipId}
                          className="flex items-center justify-between rounded border bg-gray-50 px-3 py-2"
                        >
                          <span className="text-sm font-medium">{team.teamName}</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={team.role}
                              onChange={(e) => handleRoleChange(team.membershipId, e.target.value as TeamRole)}
                              disabled={updatingMembership === team.membershipId}
                              className="rounded border px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                            >
                              {ADMIN_TEAM_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(team.membershipId)}
                              disabled={updatingMembership === team.membershipId}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="Aus Team entfernen"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Team Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                      className="flex items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Team hinzufuegen
                    </button>

                    {showTeamDropdown && (
                      <div className="absolute left-0 top-full z-10 mt-1 w-72 rounded border bg-white shadow-lg">
                        <div className="p-2 border-b">
                          <input
                            type="text"
                            value={teamSearchQuery}
                            onChange={(e) => setTeamSearchQuery(e.target.value)}
                            placeholder="Team suchen..."
                            className="w-full rounded border px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredAvailableTeams.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {availableTeams.length === 0
                                ? 'Alle Teams bereits zugeordnet'
                                : 'Keine Teams gefunden'}
                            </div>
                          ) : (
                            filteredAvailableTeams.map((team) => (
                              <button
                                key={team.id}
                                type="button"
                                onClick={() => handleAddTeam(team.id)}
                                disabled={updatingMembership === team.id}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 disabled:opacity-50"
                              >
                                {team.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              onClick={onCancel}
            >
              Abbrechen
            </button>
            <button
              disabled={isSubmitting}
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-50"
            >
              {mode === 'create' ? 'Anlegen' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>

      {/* Click outside to close team dropdown */}
      {showTeamDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowTeamDropdown(false)}
        />
      )}
    </div>
  )
}
