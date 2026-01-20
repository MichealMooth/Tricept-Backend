/**
 * RoleSelect Component
 *
 * Dropdown for selecting and updating a team member's role.
 * Shows loading state during API update.
 *
 * Task Group 3.6
 */

import { useState } from 'react'
import { updateMemberRole } from '@/services/team.service'
import { ADMIN_TEAM_ROLES, type TeamRole } from '@/types/team'

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
  USER: 'User',
}

export interface RoleSelectProps {
  membershipId: string
  currentRole: TeamRole
  onRoleChange?: () => void
}

export function RoleSelect(props: RoleSelectProps) {
  const { membershipId, currentRole, onRoleChange } = props
  const [role, setRole] = useState<TeamRole>(currentRole)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newRole: TeamRole) => {
    if (newRole === role) return
    setLoading(true)
    try {
      await updateMemberRole(membershipId, newRole)
      setRole(newRole)
      onRoleChange?.()
    } catch (error) {
      console.error('Failed to update role:', error)
      // Reset to current role on error
      setRole(currentRole)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as TeamRole)}
        disabled={loading}
        className={`rounded border px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
          loading ? 'cursor-wait bg-gray-100' : ''
        }`}
      >
        {ADMIN_TEAM_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {loading && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2">
          <svg
            className="h-4 w-4 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
    </div>
  )
}
