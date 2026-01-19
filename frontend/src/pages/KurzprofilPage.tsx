import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createProfile, getProfile, updateProfile, type UserProfile } from '@/services/user-profile.service'
import { mainFocusOptions } from '@/constants/enums'
import TagsInput from '@/components/TagsInput'

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-soft ring-1 ring-black/5">
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      {children}
    </section>
  )
}

function ProfileView({ data, onEdit }: { data: UserProfile; onEdit: () => void }) {
  const pr = data.projectReferences || { current: '', past: '' }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kurzprofil</h1>
          <p className="text-sm text-gray-600">Übersicht deiner Kurzprofil-Informationen.</p>
        </div>
        <button onClick={onEdit} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow">Bearbeiten</button>
      </div>
      <Section title="Allgemein">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><div className="text-xs text-gray-500">Vorname</div><div>{data.firstName}</div></div>
          <div><div className="text-xs text-gray-500">Nachname</div><div>{data.lastName}</div></div>
          <div><div className="text-xs text-gray-500">Position</div><div>{data.roleTitle}</div></div>
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Haupteinsatzgebiete</div>
            <div className="flex flex-wrap gap-2">
              {(data.mainFocus || []).map((t) => (
                <span key={t} className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 ring-1 ring-gray-200 px-3 py-1.5 text-sm">{t}</span>
              ))}
              {(!data.mainFocus || data.mainFocus.length === 0) && <span className="text-sm text-gray-500">—</span>}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Projektreferenzen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Aktuell</div>
            <div className="whitespace-pre-wrap">{pr.current || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Weitere relevante Einsätze</div>
            <div className="whitespace-pre-wrap">{pr.past || '-'}</div>
          </div>
        </div>
      </Section>

      <Section title="Erfahrungen">
        <div className="whitespace-pre-wrap">{data.experience || '-'}</div>
      </Section>

      <Section title="Zertifizierungen">
        <div className="whitespace-pre-wrap">{data.certifications || '-'}</div>
      </Section>

      <Section title="Tools / Techniken">
        <div className="flex flex-wrap gap-2">{(data.tools || []).map((t) => <span key={t} className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 ring-1 ring-gray-200 px-3 py-1.5 text-sm">{t}</span>)}</div>
      </Section>

      <Section title="Methoden / Soft Skills">
        <div className="flex flex-wrap gap-2">{(data.methods || []).map((t) => <span key={t} className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 ring-1 ring-gray-200 px-3 py-1.5 text-sm">{t}</span>)}{(data.softSkills || []).map((t) => <span key={t} className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 ring-1 ring-gray-200 px-3 py-1.5 text-sm">{t}</span>)}</div>
      </Section>

      <Section title="Bildungsabschlüsse">
        <div className="whitespace-pre-wrap">{data.education || '-'}</div>
      </Section>
    </div>
  )
}

function ProfileForm({
  initial,
  onCancel,
  onSaved,
  userId,
}: {
  initial?: Partial<UserProfile> | null
  onCancel?: () => void
  onSaved: (data: UserProfile) => void
  userId: string
}) {
  const [form, setForm] = useState<UserProfile>({
    userId,
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    roleTitle: initial?.roleTitle || '',
    mainFocus: initial?.mainFocus || [],
    projectReferences: initial?.projectReferences || { current: '', past: '' },
    experience: initial?.experience || '',
    certifications: initial?.certifications || '',
    tools: initial?.tools || [],
    methods: initial?.methods || [],
    softSkills: initial?.softSkills || [],
    education: initial?.education || '',
    profileImageUrl: initial?.profileImageUrl || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      let saved: UserProfile
      if (initial) {
        saved = await updateProfile(userId, form)
      } else {
        saved = await createProfile({ ...form, userId })
      }
      onSaved(saved)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kurzprofil</h1>
        <p className="text-sm text-gray-600">Bitte fülle dein Kurzprofil aus.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <Section title="Allgemein">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Vorname</label>
            <input className="w-full border rounded px-2 py-1" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Nachname</label>
            <input className="w-full border rounded px-2 py-1" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Position</label>
            <select className="w-full border rounded px-2 py-1" value={form.roleTitle} onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))} required>
              <option value="">Bitte wählen…</option>
              {['Junior Consultant','Consultant','Senior Consultant','Lead','Manager'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Haupteinsatzgebiete (bis zu 4)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {mainFocusOptions.map((opt) => {
                const checked = (form.mainFocus || []).includes(opt.value)
                return (
                  <label key={opt.value} className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${checked ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm((f) => {
                          const cur = new Set(f.mainFocus || [])
                          if (e.target.checked) {
                            if (cur.size >= 4) return f // max 4
                            cur.add(opt.value)
                          } else {
                            cur.delete(opt.value)
                          }
                          return { ...f, mainFocus: Array.from(cur) }
                        })
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                )
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">Wähle bis zu 4 Stichworte.</div>
          </div>
        </div>
      </Section>

      <Section title="Projektreferenzen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Aktuell</label>
            <textarea className="w-full border rounded px-2 py-1 min-h-[80px]" value={form.projectReferences?.current || ''} onChange={(e) => setForm((f) => ({ ...f, projectReferences: { ...(f.projectReferences||{}), current: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Weitere relevante Einsätze</label>
            <textarea className="w-full border rounded px-2 py-1 min-h-[80px]" value={form.projectReferences?.past || ''} onChange={(e) => setForm((f) => ({ ...f, projectReferences: { ...(f.projectReferences||{}), past: e.target.value } }))} />
          </div>
        </div>
      </Section>

      <Section title="Erfahrungen">
        <textarea className="w-full border rounded px-2 py-1 min-h-[80px]" value={form.experience || ''} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} />
      </Section>

      <Section title="Zertifizierungen">
        <textarea className="w-full border rounded px-2 py-1 min-h-[80px]" value={form.certifications || ''} onChange={(e) => setForm((f) => ({ ...f, certifications: e.target.value }))} />
      </Section>

      <Section title="Tools / Techniken">
        <TagsInput
          value={form.tools || []}
          onChange={(v) => setForm((f) => ({ ...f, tools: v }))}
          placeholder="Stichwort eingeben und Enter drücken"
        />
      </Section>

      <Section title="Methoden / Soft Skills">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TagsInput
            value={form.methods || []}
            onChange={(v) => setForm((f) => ({ ...f, methods: v }))}
            placeholder="Methode eingeben und Enter"
          />
          <TagsInput
            value={form.softSkills || []}
            onChange={(v) => setForm((f) => ({ ...f, softSkills: v }))}
            placeholder="Soft Skill eingeben und Enter"
          />
        </div>
      </Section>

      <Section title="Bildungsabschlüsse">
        <textarea className="w-full border rounded px-2 py-1 min-h-[80px]" value={form.education || ''} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} />
      </Section>

      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded border">Abbrechen</button>}
        <button className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow" disabled={saving}>Speichern</button>
      </div>
    </form>
  )
}

export default function KurzprofilPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const userId = user?.id || ''
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      setLoading(true)
      setError(null)
      try {
        const data = await getProfile(userId)
        if (data) {
          setProfile(data)
          setEditing(false)
        } else {
          setProfile(null)
          setEditing(true)
        }
      } catch (e: any) {
        setError(e?.message || 'Laden fehlgeschlagen')
      } finally {
        setLoading(false)
      }
    }
    if (userId) void load()
  }, [userId])

  if (authLoading) return <div>Wird geladen…</div>
  if (!isAuthenticated) return <div className="text-sm text-gray-600">Bitte anmelden…</div>
  if (loading) return <div>Wird geladen…</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      {profile && !editing ? (
        <ProfileView data={profile} onEdit={() => setEditing(true)} />
      ) : (
        <ProfileForm
          initial={profile}
          userId={userId}
          onCancel={profile ? () => setEditing(false) : undefined}
          onSaved={(p) => { setProfile(p); setEditing(false) }}
        />
      )}
    </div>
  )
}
