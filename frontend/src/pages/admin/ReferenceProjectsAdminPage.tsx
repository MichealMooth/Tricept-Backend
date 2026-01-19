import React from 'react'
import { api } from '@/services/api'
import { roleOptions, topicsOptions, type Role, type Topic } from '@/constants/enums'

// Types kept in sync with ReferenzProjektePage
export type RefProject = {
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

type ImportResult = {
  index: number
  ok: boolean
  error?: string
  errors?: { field: string; column: string; message: string; expected?: string }[]
}

export default function ReferenceProjectsAdminPage() {
  const [q, setQ] = React.useState({ search: '', role: '', topic: '', page: 1, pageSize: 20 })
  const [data, setData] = React.useState<ListResponse>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [importing, setImporting] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState({ done: 0, total: 0, ok: 0, fail: 0 })
  const [lastImport, setLastImport] = React.useState<null | { ok: number; fail: number; results: ImportResult[] }>(null)

  // Modal state
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

  React.useEffect(() => { load() }, [load])

  const onDelete = async (id: string) => {
    if (!confirm('Referenzprojekt wirklich löschen?')) return
    try {
      await api.delete(`/reference-projects/${id}`)
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Löschen fehlgeschlagen')
    }
  }

  // Excel import handler (dynamic import of xlsx)
  const onImport = async (file: File) => {
    try {
      if (importing) { alert('Ein Import läuft bereits. Bitte warten.'); return }
      const XLSX: any = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      if (rows.length <= 1) return alert('Keine Datenzeilen gefunden (erwarte Daten ab Zeile 2).')

      // Normalize header cells: remove NBSP, collapse spaces, lowercase
      const norm = (s: string) => s
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
      const headerRaw: string[] = (rows[0] || []).map((h: unknown) => String((h as string) || ''))
      const header: string[] = headerRaw.map((h: string) => norm(h))

      // Flexible finder supporting alternate spellings
      const findAny = (names: string[]) => header.findIndex((h: string) => names.map(norm).includes(h))
      const find = (name: string | string[]) => Array.isArray(name) ? findAny(name) : findAny([name])
      const idx = {
        person: find(['Person']),
        project_name: find(['Projektname']),
        customer: find(['Kunde']),
        project_description: find(['Beschreibung des Projekts (3-5 Sätze)', 'Beschreibung des Projekts (3–5 Sätze)']),
        role: find(['Rolle im Projekt']),
        activity_description: find(['Beschreibung der Tätigkeit', 'Beschreibung der Tätigkeit ']),
        duration_from: find(['Laufzeit von']),
        duration_to: find(['Laufzeit bis']),
        contact_person: find(['Ansprechpartner']),
        approved: find(['Für Nutzung freigegeben', 'Fuer Nutzung freigegeben', 'Freigegeben']),
        topic1: find(['Themenbereich 1']),
        topic2: find(['Themenbereich 2']),
        topic3: find(['Themenbereich 3']),
        topic4: find(['Themenbereich 4']),
        topic5: find(['Themenbereich 5']),
        topic6: find(['Themenbereich 6']),
      }
      const missing = Object.entries(idx)
        .filter(([k, v]) => v === -1 && !k.startsWith('topic'))
        .map(([k]) => k)
      if (missing.length) {
        console.error('Header erkannt:', headerRaw)
        return alert('Fehlende Spalten: ' + missing.join(', ') + '\nBitte prüfe die Überschriften in Zeile 1.')
      }

      const payloads: Omit<RefProject, 'id' | 'created_at' | 'updated_at'>[] = [] as any
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.length === 0) continue
        const duration_from = idx.duration_from >= 0 ? String(row[idx.duration_from] || '').trim() : ''
        const duration_to = idx.duration_to >= 0 ? String(row[idx.duration_to] || '').trim() : ''
        const topics = [idx.topic1, idx.topic2, idx.topic3, idx.topic4, idx.topic5, idx.topic6]
          .map((i) => (i != null && i >= 0 ? String(row[i] || '').trim() : ''))
          .filter(Boolean) as Topic[]
        const contact_person = idx.contact_person >= 0 ? String(row[idx.contact_person] || '').trim() : ''
        const approvedRaw = idx.approved >= 0 ? String(row[idx.approved] || '').trim().toLowerCase() : ''
        const approved = ['ja', 'yes', 'true', 'x', '1'].includes(approvedRaw)
        const rec = {
          person: String(row[idx.person] || ''),
          project_name: String(row[idx.project_name] || ''),
          customer: String(row[idx.customer] || ''),
          project_description: String(row[idx.project_description] || ''),
          role: String(row[idx.role] || '') as Role,
          activity_description: String(row[idx.activity_description] || ''),
          duration_from,
          duration_to,
          contact_person,
          approved,
          topics,
        }
        payloads.push(rec as any)
      }
      if (!payloads.length) return alert('Keine gültigen Datensätze gefunden. Bitte Inhalt prüfen.')

      // Batch-Import via Backend
      setImporting(true)
      setImportProgress({ done: 0, total: payloads.length, ok: 0, fail: 0 })
      const resp = await api.post('/reference-projects/import', payloads, { timeout: 120000 })
      const summary = resp.data as { ok: number; fail: number; results: ImportResult[] }
      setImportProgress({ done: payloads.length, total: payloads.length, ok: summary.ok, fail: summary.fail })
      setLastImport(summary)
      if (summary.fail > 0) {
        console.warn('Import-Fehlerdetails', summary.results.filter((r) => !r.ok))
      }
      alert(`Import abgeschlossen: ${summary.ok} erfolgreich, ${summary.fail} fehlgeschlagen.`)
      load()
    } catch (e: any) {
      console.error('Excel-Import Fehler:', e)
      alert('Import fehlgeschlagen. Bitte stelle sicher, dass die Datei geöffnet werden konnte und die Überschriften korrekt sind.')
    }
    finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary_dark">Referenz Projekte (Admin)</h1>
        <div className="flex items-center gap-2">
          <label className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer shadow-sm ${importing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}>
            <input type="file" accept=".xlsx,.xls" className="hidden" disabled={importing} onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.currentTarget.value=''; }} />
            {importing ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M22 12a10 10 0 0 1-10 10"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            )}
            {importing ? `Import läuft… ${importProgress.done}/${importProgress.total}` : 'Excel importieren'}
          </label>
        </div>
      </header>

      {importing && (
        <div className="text-sm text-gray-600">Status: {importProgress.done}/{importProgress.total} — erfolgreich: {importProgress.ok}, fehlgeschlagen: {importProgress.fail}</div>
      )}

      {lastImport && (
        <div className="bg-white rounded-xl p-4 shadow-soft ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-700">Letzter Import: <strong>{lastImport.ok}</strong> erfolgreich, <strong>{lastImport.fail}</strong> fehlgeschlagen.</div>
            <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50" onClick={() => setLastImport(null)}>Liste leeren</button>
          </div>
          {lastImport.fail > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Zeile (Excel)</th>
                    <th className="text-left font-medium px-4 py-2">Spalte</th>
                    <th className="text-left font-medium px-4 py-2">Fehler</th>
                    <th className="text-left font-medium px-4 py-2">Erwartet</th>
                  </tr>
                </thead>
                <tbody>
                  {(lastImport.results as ImportResult[])
                    .filter((r) => !r.ok)
                    .flatMap((r: ImportResult) => (r.errors && r.errors.length ? r.errors : [{ column: 'Unbekannt', message: r.error || 'Unbekannter Fehler' } as any])
                      .map((err: any, i: number) => (
                        <tr key={`${r.index}-${i}`} className="border-t">
                          <td className="px-4 py-2">{r.index + 2}</td>
                          <td className="px-4 py-2">{err.column || 'Unbekannt'}</td>
                          <td className="px-4 py-2 text-red-700">{err.message || 'Unbekannter Fehler'}</td>
                          <td className="px-4 py-2">{err.expected || ''}</td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-emerald-700">Alle Zeilen erfolgreich importiert.</div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-soft ring-1 ring-black/5">
        <div className="overflow-x-auto">
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
                <th className="text-right font-medium px-4 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="px-4 py-4" colSpan={7}>Lade…</td></tr>}
              {!loading && data.items.length === 0 && <tr><td className="px-4 py-8 text-gray-500" colSpan={9}>Keine Referenzen vorhanden.</td></tr>}
              {!loading && data.items.map((it) => (
                <tr key={it.id} className="border-t">
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
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => setEditItem(it)}>Bearbeiten</button>
                      <button className="rounded-md border border-red-200 bg-red-50 text-red-700 px-2 py-1 text-sm hover:bg-red-100" onClick={() => onDelete(it.id)}>Löschen</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <AdminRefProjectModal mode="create" onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load() }} />
      )}
      {editItem && (
        <AdminRefProjectModal mode="edit" item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); load() }} />
      )}
    </div>
  )
}

type ModalProps = { mode: 'edit' | 'create'; item?: RefProject; onClose: () => void; onSaved: () => void }

function AdminRefProjectModal({ mode, item, onClose, onSaved }: ModalProps) {
  const [form, setForm] = React.useState<Partial<RefProject>>(() => item ? { ...item } : {
    person: '', project_name: '', customer: '', contact_person: '', approved: false, role: '' as Role, duration_from: '', duration_to: '', project_description: '', activity_description: '', topics: ['' as Topic]
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const readOnly = false
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
    const v = validate(); if (v) { setError(v); return }
    setSaving(true)
    try {
      if (mode === 'create') await api.post('/reference-projects', pickForSubmit(form))
      else if (mode === 'edit' && item) await api.put(`/reference-projects/${item.id}`, pickForSubmit(form))
      onSaved()
    } catch (e: any) { setError(e?.response?.data?.message || 'Speichern fehlgeschlagen') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{mode === 'create' ? 'Neues Referenzprojekt' : 'Referenzprojekt bearbeiten'}</h2>
          <button className="rounded border px-3 py-1 text-sm" onClick={onClose}>Schließen</button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Person" value={form.person || ''} onChange={(v) => setField('person', v)} required />
          <TextField label="Projektname" value={form.project_name || ''} onChange={(v) => setField('project_name', v)} required />
          <TextField label="Kunde" value={form.customer || ''} onChange={(v) => setField('customer', v)} required />
          <TextField label="Ansprechpartner" value={form.contact_person || ''} onChange={(v) => setField('contact_person', v)} required />
          <TextField label="Laufzeit von" placeholder="z. B. 01/2022" value={form.duration_from || ''} onChange={(v) => setField('duration_from', v)} required />
          <TextField label="Laufzeit bis" placeholder="z. B. 12/2023" value={form.duration_to || ''} onChange={(v) => setField('duration_to', v)} required />
          <SelectField label="Rolle im Projekt" value={(form.role as string) || ''} onChange={(v) => setField('role', v as Role)} required options={roleOptions} />
          <div className="md:col-span-2"><TextAreaField label="Beschreibung des Projekts (3–5 Sätze)" value={form.project_description || ''} onChange={(v) => setField('project_description', v)} required /></div>
          <div className="md:col-span-2"><TextAreaField label="Beschreibung der Tätigkeit" value={form.activity_description || ''} onChange={(v) => setField('activity_description', v)} required /></div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={!!form.approved} onChange={(e) => setField('approved', e.target.checked)} />
            <span>Für Nutzung freigegeben</span>
          </label>
          <div className="md:col-span-2">
            {/* Reuse of simple multi-selects for topics via free text select; better to use DynamicTopicsSelect if needed */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700">Themenbereiche (bis zu 6) *</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[0,1,2,3,4,5].map((i) => (
                  <select key={i} className="rounded-md border border-input px-3 py-2 text-sm" value={(form.topics?.[i] as string) || ''}
                    onChange={(e) => {
                      const next = [...(form.topics || [])] as Topic[]
                      next[i] = e.target.value as Topic
                      setField('topics', next)
                    }}>
                    <option value="">Themenbereich wählen</option>
                    {topicsOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                ))}
              </div>
              <small className="text-muted-foreground">Mindestens 1, maximal 6 Themenbereiche.</small>
            </label>
          </div>
        </div>

        {error && <div className="px-4 pb-2 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" className="rounded-md px-3 py-2 text-sm border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200" onClick={onClose}>Abbrechen</button>
          <button type="button" className="rounded-md px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" onClick={submit} disabled={saving}>{mode === 'create' ? 'Anlegen' : 'Änderungen speichern'}</button>
        </div>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? ' *' : ''}</span>
      <input className="rounded-md border border-input px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? ' *' : ''}</span>
      <textarea rows={4} className="rounded-md border border-input px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

function SelectField({ label, value, onChange, required, options }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? ' *' : ''}</span>
      <select className="rounded-md border border-input px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
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
