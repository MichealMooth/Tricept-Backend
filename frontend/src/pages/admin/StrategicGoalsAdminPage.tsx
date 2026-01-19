import { useEffect, useState } from 'react'
import {
  listGoalsAdmin,
  importGoalsAdmin,
  createGoalAdmin,
  updateGoalAdmin,
  deleteGoalAdmin,
  type StrategicGoal,
} from '@/services/strategic-goals.service'

export default function StrategicGoalsAdminPage() {
  const [goals, setGoals] = useState<StrategicGoal[]>([])
  const [jsonInput, setJsonInput] = useState<string>('[\n  { "key": "SG-2025-01", "title": "Beispielziel", "description": "Beschreibung" }\n]')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<{ id?: string; key: string; title: string; description?: string; displayOrder?: number; isActive?: boolean }>({ key: '', title: '', description: '', displayOrder: 0, isActive: true })
  const isEdit = !!form.id

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listGoalsAdmin()
        setGoals(data)
      } catch (e) {
        setError('Laden fehlgeschlagen')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const onImport = async () => {
    setError(null)
    try {
      const payload = JSON.parse(jsonInput)
      const data = await importGoalsAdmin(payload)
      setGoals(data)
    } catch (e: any) {
      setError('Import fehlgeschlagen: ' + (e?.message || 'Ungültiges JSON'))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (isEdit) {
        const updated = await updateGoalAdmin(form.id!, { key: form.key, title: form.title, description: form.description, displayOrder: form.displayOrder, isActive: form.isActive })
        setGoals((arr) => arr.map((g) => (g.id === updated.id ? updated : g)))
      } else {
        const created = await createGoalAdmin({ key: form.key, title: form.title, description: form.description, displayOrder: form.displayOrder, isActive: form.isActive })
        setGoals((arr) => [...arr, created])
      }
      setForm({ key: '', title: '', description: '', displayOrder: 0, isActive: true })
    } catch (e) {
      setError('Speichern fehlgeschlagen')
    }
  }

  const onEdit = (g: StrategicGoal) => setForm({ id: g.id, key: g.key, title: g.title, description: g.description ?? '', displayOrder: g.displayOrder, isActive: g.isActive })
  const onDelete = async (id: string) => {
    if (!confirm('Ziel wirklich löschen?')) return
    await deleteGoalAdmin(id)
    setGoals((arr) => arr.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Strategische Ziele (Admin)</h1>
          <p className="text-sm text-gray-600">Importiere, erfasse und verwalte strategische Ziele.</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* JSON Import */}
      <section className="rounded-xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <h2 className="text-lg font-semibold mb-2">JSON Import</h2>
        <textarea className="w-full border rounded p-2 font-mono text-sm min-h-[120px]" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
        <div className="mt-2 flex justify-end">
          <button onClick={onImport} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow">Importieren</button>
        </div>
      </section>

      {/* Erfassung / Bearbeitung */}
      <section className="rounded-xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <h2 className="text-lg font-semibold mb-3">{isEdit ? 'Ziel bearbeiten' : 'Neues Ziel erfassen'}</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Key</label>
            <input className="w-full border rounded px-2 py-1" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Titel</label>
            <input className="w-full border rounded px-2 py-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Beschreibung</label>
            <input className="w-full border rounded px-2 py-1" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Reihenfolge</label>
            <input type="number" className="w-full border rounded px-2 py-1" value={form.displayOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))} />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" className="border rounded" checked={form.isActive ?? true} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="isActive">Aktiv</label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            {isEdit && (
              <button type="button" onClick={() => setForm({ key: '', title: '', description: '', displayOrder: 0, isActive: true })} className="px-3 py-1.5 rounded border">Abbrechen</button>
            )}
            <button className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow" disabled={loading}>{isEdit ? 'Aktualisieren' : 'Anlegen'}</button>
          </div>
        </form>
      </section>

      {/* Übersicht */}
      <section className="rounded-xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <h2 className="text-lg font-semibold mb-3">Aktuelle Ziele</h2>
        {loading ? (
          <div>Wird geladen…</div>
        ) : (
          <div className="divide-y">
            {goals.map((g) => (
              <div key={g.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-sm text-gray-600">{g.key}{g.description ? ` — ${g.description}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(g)} className="px-2 py-1 rounded border hover:bg-gray-50">Bearbeiten</button>
                  <button onClick={() => onDelete(g.id)} className="px-2 py-1 rounded border hover:bg-gray-50">Löschen</button>
                </div>
              </div>
            ))}
            {goals.length === 0 && <div className="text-gray-600">Keine Ziele vorhanden.</div>}
          </div>
        )}
      </section>
    </div>
  )
}
