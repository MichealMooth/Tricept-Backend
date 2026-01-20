/**
 * TeamDetailPage Component
 *
 * Admin page for viewing and managing a single team and its members.
 * Features: team info header, member table with role management, add/remove members.
 *
 * Task Group 3.4
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTeam,
  updateTeam,
  getTeamMembers,
  addTeamMember,
  removeMember,
} from '@/services/team.service'
import type {
  Team,
  TeamMember,
  UpdateTeamInput,
  AddTeamMemberInput,
} from '@/types/team'
import { TeamForm } from '@/components/admin/TeamForm'
import { AddMemberDialog } from '@/components/admin/AddMemberDialog'
import { RoleSelect } from '@/components/admin/RoleSelect'

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberPage, setMemberPage] = useState(1)
  const [memberTotal, setMemberTotal] = useState(0)
  const memberPageSize = 10

  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)

  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const loadTeam = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const data = await getTeam(teamId)
      setTeam(data)
    } catch (error) {
      console.error('Failed to load team:', error)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  const loadMembers = useCallback(async () => {
    if (!teamId) return
    setMembersLoading(true)
    try {
      const response = await getTeamMembers(teamId, {
        search: memberSearch || undefined,
        page: memberPage,
        pageSize: memberPageSize,
      })
      setMembers(response.items)
      setMemberTotal(response.total)
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setMembersLoading(false)
    }
  }, [teamId, memberSearch, memberPage, memberPageSize])

  // Initial load
  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  // Debounced member search
  useEffect(() => {
    const timer = setTimeout(() => {
      setMemberPage(1)
      void loadMembers()
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch])

  const handleUpdateTeam = async (data: UpdateTeamInput) => {
    if (!teamId) return
    await updateTeam(teamId, data)
    setShowEditForm(false)
    await loadTeam()
  }

  const handleAddMember = async (data: AddTeamMemberInput) => {
    if (!teamId) return
    await addTeamMember(teamId, data)
    setShowAddMember(false)
    await loadMembers()
  }

  const handleRemoveMember = async (member: TeamMember) => {
    const name = `${member.employee.firstName} ${member.employee.lastName}`
    if (!window.confirm(`"${name}" wirklich aus dem Team entfernen?`)) return
    await removeMember(member.id)
    await loadMembers()
  }

  const handleRoleChange = async () => {
    // Reload members after role change
    await loadMembers()
  }

  const totalMemberPages = Math.ceil(memberTotal / memberPageSize)
  const existingMemberIds = members.map((m) => m.employeeId)

  if (loading) {
    return <div className="text-gray-600">Lade Team...</div>
  }

  if (!team) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Team nicht gefunden</p>
        <button
          className="text-indigo-600 hover:underline"
          onClick={() => navigate('/admin/teams')}
        >
          Zurueck zur Teamliste
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs ${
                team.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {team.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
          {team.description && (
            <p className="mt-1 text-gray-600">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            onClick={() => navigate('/admin/teams')}
          >
            Zurueck
          </button>
          <button
            className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
            onClick={() => setShowEditForm(true)}
          >
            Bearbeiten
          </button>
        </div>
      </div>

      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Mitglieder ({memberTotal})</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Mitglieder suchen..."
              className="w-64 rounded border px-3 py-2 text-sm"
            />
            <button
              className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
              onClick={() => setShowAddMember(true)}
            >
              Mitglied hinzufuegen
            </button>
          </div>
        </div>

        {membersLoading && <div className="text-sm text-gray-600">Lade...</div>}

        <div className="overflow-auto rounded border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">E-Mail</th>
                <th className="px-2 py-2">Rolle</th>
                <th className="w-32 px-2 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2">
                    {member.employee.firstName} {member.employee.lastName}
                  </td>
                  <td className="px-2 py-2">{member.employee.email}</td>
                  <td className="px-2 py-2">
                    <RoleSelect
                      membershipId={member.id}
                      currentRole={member.role}
                      onRoleChange={handleRoleChange}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleRemoveMember(member)}
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && !membersLoading && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                    Keine Mitglieder gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Member Pagination */}
        {totalMemberPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Seite {memberPage} von {totalMemberPages}
            </span>
            <div className="flex gap-2">
              <button
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                disabled={memberPage <= 1}
                onClick={() => setMemberPage((p) => p - 1)}
              >
                Zurueck
              </button>
              <button
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                disabled={memberPage >= totalMemberPages}
                onClick={() => setMemberPage((p) => p + 1)}
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Team Modal */}
      {showEditForm && (
        <TeamForm
          mode="edit"
          initial={{
            name: team.name,
            description: team.description ?? '',
          }}
          onCancel={() => setShowEditForm(false)}
          onSubmit={handleUpdateTeam}
        />
      )}

      {/* Add Member Dialog */}
      {showAddMember && (
        <AddMemberDialog
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
          onSubmit={handleAddMember}
          existingMemberIds={existingMemberIds}
        />
      )}
    </div>
  )
}
