import React from 'react'
import { api } from '@/services/api'
import { roleOptions, topicsOptions, type Role, type Topic } from '@/constants/enums'
import DynamicTopicsSelect from '@/components/DynamicTopicsSelect'
import { useSearchParams } from 'react-router-dom'

type RefProject = {
  id: string
  person: string
  project_name: string
  customer: string
  project_description: string
  role: Role
  activity_description: string
  duration_from: string
  duration_to: string
  contact_person: string
  approved: boolean
  topics: Topic[]
  created_at: string
  updated_at: string
}

type ListResponse = { items: RefProject[]; total: number; page: number; pageSize: number }

function useQueryState() {
  const [sp, setSp] = useSearchParams()
  const q = React.useMemo(
    () => ({
      search: sp.get('search') || '',
      role: sp.get('role') || '',
      topic: sp.get('topic') || '',
      page: Number(sp.get('page') || '1'),
      pageSize: Number(sp.get('pageSize') || '20'),
    }),
    [sp]
  )
  const update = (patch: Partial<typeof q>) => {
    const next = { ...q, ...patch }
    const entries: [string, string][] = []
    Object.entries(next).forEach(([k, v]) => {
      const s = String(v || '')
      if (s) entries.push([k, s])
    })
    setSp(entries, { replace: true })
  }
  return { q, update }
}

export default function ReferenzProjektePage() {
  const { q, update } = useQueryState()
  const [data, setData] = React.useState<ListResponse>({ items: [], total: 0, page: q.page, pageSize: q.pageSize })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Modal state
  const [viewItem, setViewItem] = React.useState<RefProject | null>(null)
  const [editItem, setEditItem] = React.useState<RefProject | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/reference-projects', { params: q })
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || 'Laden fehlgeschlagen'))
      .finally(() => setLoading(false))
  }, [q])

  React.useEffect(() => {
    load()
  }, [load])

  const onRowClick = (it: RefProject) => {
    setViewItem(it)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary_dark">Referenz Projekte</h1>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-md ring-1 ring-black/5 hover:shadow-lg hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/40 active:translate-y-px transition"
          onClick={() => setCreateOpen(true)}
          title="Neues Referenzprojekt"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Neues Referenzprojekt
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-soft ring-1 ring-black/5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="search"
          placeholder="Suchen nach Person, Projektname, Kunde…"
          className="rounded-md border border-input px-3 py-2 text-sm"
          defaultValue={q.search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update({ search: (e.target as HTMLInputElement).value, page: 1 })
          }}
        />
        <select
          className="rounded-md border border-input px-3 py-2 text-sm"
          value={q.role}
          onChange={(e) => update({ role: e.target.value || undefined, page: 1 })}
        >
          <option value="">Rolle filtern</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input px-3 py-2 text-sm"
          value={q.topic}
          onChange={(e) => update({ topic: e.target.value || undefined, page: 1 })}
        >
          <option value="">Themenbereich filtern</option>
          {topicsOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => update({ page: 1 })}>Anwenden</button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => update({ search: '', role: '', topic: '', page: 1 })}>Zurücksetzen</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-soft ring-1 ring-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left font-medium px-4 py-2">Person</th>
              <th className="text-left font-medium px-4 py-2">Projektname</th>
              <th className="text-left font-medium px-4 py-2">Kunde</th>
              <th className="text-left font-medium px-4 py-2">Ansprechpartner</th>
              <th className="text-left font-medium px-4 py-2">Rolle</th>
              <th className="text-left font-medium px-4 py-2">Laufzeit</th>
              <th className="text-left font-medium px-4 py-2">Freigabe</th>
              <th className="text-left font-medium px-4 py-2">Themen</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4" colSpan={8}>Lade…</td></tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr><td className="px-4 py-8 text-gray-500" colSpan={8}>Noch keine Referenzprojekte vorhanden.</td></tr>
            )}
            {!loading && data.items.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(it)}>
                <td className="px-4 py-2">{it.person}</td>
                <td className="px-4 py-2">{it.project_name}</td>
                <td className="px-4 py-2">{it.customer}</td>
                <td className="px-4 py-2">{it.contact_person}</td>
                <td className="px-4 py-2">{it.role}</td>
                <td className="px-4 py-2">{`${it.duration_from}–${it.duration_to}`}</td>
                <td className="px-4 py-2">{it.approved ? 'Ja' : 'Nein'}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {it.topics.slice(0, 3).map((t) => (
                      <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">{t}</span>
                    ))}
                    {it.topics.length > 3 && (
                      <span className="text-xs text-gray-600">+{it.topics.length - 3}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && data.total > data.pageSize && (
        <div className="flex items-center justify-end gap-2">
          <button className="rounded border px-3 py-1" disabled={data.page <= 1} onClick={() => update({ page: data.page - 1 })}>Zurück</button>
          <span className="text-sm">Seite {data.page}</span>
          <button className="rounded border px-3 py-1" disabled={data.page * data.pageSize >= data.total} onClick={() => update({ page: data.page + 1 })}>Weiter</button>
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <RefProjectModal
          title="Neues Referenzprojekt"
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); load() }}
        />
      )}
      {viewItem && (
        <RefProjectModal
          title="Referenzprojekt"
          mode="view"
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => { setEditItem(viewItem); setViewItem(null) }}
        />
      )}
      {editItem && (
        <RefProjectModal
          title="Referenzprojekt bearbeiten"
          mode="edit"
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); load() }}
        />
      )}
    </div>
  )
}

type ModalProps = {
  title: string
  mode: 'view' | 'edit' | 'create'
  item?: RefProject
  onClose: () => void
  onSaved?: () => void
  onEdit?: () => void
}

function RefProjectModal({ title, mode, item, onClose, onSaved, onEdit }: ModalProps) {
  const [form, setForm] = React.useState<Partial<RefProject>>(() => item ? { ...item } : {
    person: '', project_name: '', customer: '', contact_person: '', approved: false, role: '' as Role, duration_from: '', duration_to: '', project_description: '', activity_description: '', topics: ['' as Topic]
  })
  const readOnly = mode === 'view'
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  const setField = (k: keyof RefProject, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    if (!form.person || !form.project_name || !form.customer || !form.contact_person || !form.role || !form.duration_from || !form.duration_to || !form.project_description || !form.activity_description) return 'Bitte alle Pflichtfelder ausfüllen.'
    const topics = (form.topics || []).filter(Boolean)
    if (topics.length < 1 || topics.length > 6) return 'Mindestens 1, maximal 6 Themenbereiche.'
    const sentences = (form.project_description || '').replace(/\s+/g, ' ').trim().split(/[.!?]+\s*/).filter(Boolean).length
    if (sentences < 3 || sentences > 5) return 'Beschreibung des Projekts: 3–5 Sätze.'
    return null
  }

  const submit = async () => {
    const v = validate()
    if (v) { setError(v); return }
    setSaving(true)
    try {
      if (mode === 'create') {
        await api.post('/reference-projects', pickForSubmit(form))
      } else if (mode === 'edit' && item) {
        await api.put(`/reference-projects/${item.id}`, pickForSubmit(form))
      }
      onSaved?.()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {mode === 'view' && (
              <button className="rounded border px-3 py-1 text-sm" onClick={() => onEdit?.()}>Bearbeiten</button>
            )}
            <button className="rounded border px-3 py-1 text-sm" onClick={onClose}>Schließen</button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Person" value={form.person || ''} onChange={(v) => setField('person', v)} readOnly={readOnly} required />
          <TextField label="Projektname" value={form.project_name || ''} onChange={(v) => setField('project_name', v)} readOnly={readOnly} required />
          <TextField label="Kunde" value={form.customer || ''} onChange={(v) => setField('customer', v)} readOnly={readOnly} required />
          <TextField label="Ansprechpartner" value={form.contact_person || ''} onChange={(v) => setField('contact_person', v)} readOnly={readOnly} required />
          <TextField label="Laufzeit von" placeholder="z. B. 01/2022" value={form.duration_from || ''} onChange={(v) => setField('duration_from', v)} readOnly={readOnly} required />
          <TextField label="Laufzeit bis" placeholder="z. B. 12/2023" value={form.duration_to || ''} onChange={(v) => setField('duration_to', v)} readOnly={readOnly} required />
          <SelectField label="Rolle im Projekt" value={(form.role as string) || ''} onChange={(v) => setField('role', v as Role)} readOnly={readOnly} required options={roleOptions} />
          <div className="md:col-span-2"><TextAreaField label="Beschreibung des Projekts (3–5 Sätze)" value={form.project_description || ''} onChange={(v) => setField('project_description', v)} readOnly={readOnly} required /></div>
          <div className="md:col-span-2"><TextAreaField label="Beschreibung der Tätigkeit" value={form.activity_description || ''} onChange={(v) => setField('activity_description', v)} readOnly={readOnly} required /></div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={!!form.approved} onChange={(e) => setField('approved', e.target.checked)} disabled={readOnly} />
            <span>Für Nutzung freigegeben</span>
          </label>
          <div className="md:col-span-2">
            <DynamicTopicsSelect value={(form.topics as Topic[]) || ['' as Topic]} onChange={(v) => setField('topics', v)} label={`Themenbereiche (bis zu 6)`} />
          </div>
        </div>

        {error && <div className="px-4 pb-2 text-sm text-red-600">{error}</div>}

        {(mode === 'edit' || mode === 'create') && (
          <div className="flex justify-end gap-2 border-t px-4 py-3">
            {/* Abbrechen (links, Rot) */}
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50"
              onClick={onClose}
              disabled={saving}
            >
              Abbrechen
            </button>
            {/* Anlegen/Speichern (Grün) */}
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
              onClick={submit}
              disabled={saving}
            >
              {mode === 'create' ? 'Anlegen' : 'Änderungen speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, readOnly, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; required?: boolean; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? ' *' : ''}</span>
      <input className="rounded-md border border-input px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, readOnly, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; required?: boolean; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? ' *' : ''}</span>
      <textarea rows={4} className="rounded-md border border-input px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder} />
    </label>
  )
}

function SelectField({ label, value, onChange, readOnly, required, options }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; required?: boolean; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? ' *' : ''}</span>
      <select className="rounded-md border border-input px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly}>
        <option value="">Bitte wählen…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function pickForSubmit(form: Partial<RefProject>) {
  return {
    person: form.person || '',
    project_name: form.project_name || '',
    customer: form.customer || '',
    project_description: form.project_description || '',
    role: form.role as Role,
    activity_description: form.activity_description || '',
    duration_from: form.duration_from || '',
    duration_to: form.duration_to || '',
    contact_person: form.contact_person || '',
    approved: !!form.approved,
    topics: ((form.topics || []) as (Topic | '')[]).filter(Boolean) as Topic[],
  }
}
