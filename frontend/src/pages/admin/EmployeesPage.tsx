import { useEffect, useMemo, useState } from 'react'
import { Employee, listEmployees, createEmployee, updateEmployee, archiveEmployee } from '@/services/employee.service'
import { EmployeeForm } from '@/components/admin/EmployeeForm'

export default function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<null | { mode: 'create' } | { mode: 'edit'; emp: Employee }>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listEmployees(search || undefined)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [search])

  const onCreate = async (data: { email: string; password: string; firstName: string; lastName: string; role?: string | null; department?: string | null; isAdmin?: boolean; isActive?: boolean; hireDate?: string | null }) => {
    await createEmployee(data)
    setModal(null)
    await load()
  }
  const onUpdate = async (id: string, data: Partial<{ email: string; firstName: string; lastName: string; role: string | null; department: string | null; isAdmin: boolean; isActive: boolean; hireDate: string | null }>) => {
    await updateEmployee(id, data)
    setModal(null)
    await load()
  }
  const onArchive = async (id: string) => {
    if (!confirm('Mitarbeiter archivieren?')) return
    await archiveEmployee(id)
    await load()
  }

  const filtered = useMemo(() => items, [items])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="border rounded px-3 py-2 w-64"
          />
        </div>
        <button className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow" onClick={() => setModal({ mode: 'create' })}>
          Neuer Mitarbeiter
        </button>
      </div>

      {loading && <div className="text-sm text-gray-600">Lade…</div>}

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">E-Mail</th>
              <th className="py-2 px-2">Rolle</th>
              <th className="py-2 px-2">Abteilung</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2 w-48">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="py-2 px-2">
                  {e.lastName}, {e.firstName}
                  {e.isAdmin && <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">ADMIN</span>}
                </td>
                <td className="py-2 px-2">{e.email}</td>
                <td className="py-2 px-2">{e.role ?? '—'}</td>
                <td className="py-2 px-2">{e.department}</td>
                <td className="py-2 px-2">{e.isActive ? 'Aktiv' : 'Archiviert'}</td>
                <td className="py-2 px-2 space-x-2">
                  <button className="text-blue-600" onClick={() => setModal({ mode: 'edit', emp: e })}>Bearbeiten</button>
                  {e.isActive ? (
                    <button className="text-red-600" onClick={() => onArchive(e.id)}>Archivieren</button>
                  ) : (
                    <button className="text-green-600" onClick={() => onUpdate(e.id, { isActive: true })}>Reaktivieren</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.mode === 'create' && (
        <EmployeeForm
          mode="create"
          onCancel={() => setModal(null)}
          onCreate={async (d) => {
            await onCreate(d)
          }}
          onUpdate={async () => {}}
        />
      )}

      {modal?.mode === 'edit' && (
        <EmployeeForm
          mode="edit"
          initial={{
            firstName: modal.emp.firstName,
            lastName: modal.emp.lastName,
            email: modal.emp.email,
            role: modal.emp.role ?? undefined,
            department: modal.emp.department,
            isAdmin: modal.emp.isAdmin,
            isActive: modal.emp.isActive,
            hireDate: modal.emp.hireDate ?? undefined,
          }}
          onCancel={() => setModal(null)}
          onCreate={async () => {}}
          onUpdate={async (d) => {
            await onUpdate(modal.emp.id, d)
          }}
        />
      )}
    </div>
  )
}
