/**
 * TeamsPage Component
 *
 * Admin page for listing and managing teams.
 * Features: search with debounce, filter toggle, CRUD operations.
 *
 * Task Group 3.3
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listTeams,
  createTeam,
  updateTeam,
  deactivateTeam,
  activateTeam,
} from '@/services/team.service'
import type {
  TeamWithMemberCount,
  CreateTeamInput,
  UpdateTeamInput,
} from '@/types/team'
import { TeamForm } from '@/components/admin/TeamForm'

type ModalState =
  | null
  | { mode: 'create' }
  | { mode: 'edit'; team: TeamWithMemberCount }

export default function TeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([])
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const loadTeams = useCallback(async () => {
    setLoading(true)
    try {
      const response = await listTeams({
        search: search || undefined,
        page,
        pageSize,
        includeInactive,
      })
      setTeams(response.items)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to load teams:', error)
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, includeInactive])

  // Initial load
  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // Reset to first page on search
      void loadTeams()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reload when filter changes
  useEffect(() => {
    setPage(1)
    void loadTeams()
  }, [includeInactive])

  const handleCreate = async (data: CreateTeamInput) => {
    await createTeam(data)
    setModal(null)
    await loadTeams()
  }

  const handleUpdate = async (teamId: string, data: UpdateTeamInput) => {
    await updateTeam(teamId, data)
    setModal(null)
    await loadTeams()
  }

  const handleToggleActive = async (team: TeamWithMemberCount) => {
    if (team.isActive) {
      if (!window.confirm(`Team "${team.name}" wirklich deaktivieren?`)) return
      await deactivateTeam(team.id)
    } else {
      await activateTeam(team.id)
    }
    await loadTeams()
  }

  const handleRowClick = (teamId: string) => {
    navigate(`/admin/teams/${teamId}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-64 rounded border px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded"
            />
            Inaktive anzeigen
          </label>
        </div>
        <button
          className="rounded bg-indigo-600 px-3 py-1 text-white shadow hover:bg-indigo-700"
          onClick={() => setModal({ mode: 'create' })}
        >
          Neues Team
        </button>
      </div>

      {loading && <div className="text-sm text-gray-600">Lade...</div>}

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Mitglieder</th>
              <th className="w-48 px-2 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-2">
                  <button
                    className="text-left text-indigo-600 hover:underline"
                    onClick={() => handleRowClick(team.id)}
                  >
                    {team.name}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs ${
                      team.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {team.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-2 py-2">{team.memberCount}</td>
                <td className="space-x-2 px-2 py-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setModal({ mode: 'edit', team })}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className={
                      team.isActive
                        ? 'text-red-600 hover:underline'
                        : 'text-green-600 hover:underline'
                    }
                    onClick={() => handleToggleActive(team)}
                  >
                    {team.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </td>
              </tr>
            ))}
            {teams.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  Keine Teams gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Seite {page} von {totalPages} ({total} Teams)
          </span>
          <div className="flex gap-2">
            <button
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Zurueck
            </button>
            <button
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Modal for create/edit */}
      {modal?.mode === 'create' && (
        <TeamForm
          mode="create"
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}

      {modal?.mode === 'edit' && (
        <TeamForm
          mode="edit"
          initial={{
            name: modal.team.name,
            description: modal.team.description ?? '',
          }}
          onCancel={() => setModal(null)}
          onSubmit={(data) => handleUpdate(modal.team.id, data)}
        />
      )}
    </div>
  )
}
