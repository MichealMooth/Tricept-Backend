import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchCategoriesTree, fetchSkills, CategoryTree, SkillSummary } from '@/services/skill.service'
import { listForEmployee, createAssessment, getPeerAverage, getHistory } from '@/services/assessment.service'
import { SkillRatingInput } from '@/components/SkillRatingInput'

export default function MySkillsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [tree, setTree] = useState<CategoryTree[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [selfRatings, setSelfRatings] = useState<Record<string, { rating: number; comment: string | null }>>({})
  const [peerAverages, setPeerAverages] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'form' | 'history'>('form')
  const [formValues, setFormValues] = useState<Record<string, { rating: number; comment: string }>>({})
  const [histories, setHistories] = useState<Record<string, Array<{ rating: number; comment: string | null; validFrom: string }>>>({})

  // Build a quick lookup for categories to resolve the selected node efficiently.
  const selectedCategory = useMemo(() => {
    const byId = new Map<string, CategoryTree>()
    const walk = (nodes: CategoryTree[]) => nodes.forEach(n => { byId.set(n.id, n); if (n.children?.length) walk(n.children) })
    walk(tree)
    return selectedCategoryId ? byId.get(selectedCategoryId) || null : null
  }, [tree, selectedCategoryId])

  // ---------- helpers ----------
  /**
   * Choose a default category ID, preferring the first node that has skills.
   */
  const pickDefaultCategoryId = (nodes: CategoryTree[]): string | null => {
    if (!nodes.length) return null
    const queue = [...nodes]
    let candidate: string | null = null
    while (queue.length) {
      const node = queue.shift()!
      if (!candidate) candidate = node.id
      if (node.skills && node.skills.length) return node.id
      if (node.children?.length) queue.unshift(...node.children)
    }
    return candidate
  }

  /**
   * Format the last known self rating for compact table display.
   */
  const formatLastSelfRating = (last?: { rating: number } | undefined) =>
    typeof last?.rating === 'number' ? (last.rating === 0 ? '0 (Unbekannt)' : `${last.rating}/10`) : 'neu'

  useEffect(() => {
    const loadCategories = async () => {
      const treeData = await fetchCategoriesTree()
      setTree(treeData)
      if (!selectedCategoryId && treeData.length) {
        const def = pickDefaultCategoryId(treeData)
        if (def) setSelectedCategoryId(def)
      }
    }
    void loadCategories()
  }, [])

  // Sync mode from query param (?mode=form|history) controlled by navbar dropdown
  useEffect(() => {
    const m = searchParams.get('mode')
    setMode(m === 'history' ? 'history' : 'form')
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    const loadAssessments = async () => {
      const summary = await listForEmployee(user.id)
      const sr: Record<string, { rating: number; comment: string | null }> = {}
      summary.forEach(s => { if (s.selfRating) sr[s.skill.id] = s.selfRating })
      setSelfRatings(sr)
    }
    void loadAssessments()
  }, [user])

  useEffect(() => {
    if (!selectedCategoryId) { setSkills([]); return }
    const loadCategorySkills = async () => {
      const s = await fetchSkills({ categoryId: selectedCategoryId, isActive: true })
      setSkills(s)
      setFormValues(prev => {
        const clone = { ...prev }
        for (const sk of s) {
          const last = selfRatings[sk.id]?.rating
          // Default to 1 so 'Unbekannt' ist initial aus und der Slider aktiv
          clone[sk.id] = { rating: typeof last === 'number' ? last : 1, comment: '' }
        }
        return clone
      })
      if (user) {
        const entries = await Promise.all(
          s.map(async (sk: SkillSummary) => ({ id: sk.id, avg: await getPeerAverage(user.id, sk.id) }))
        )
        const avgMap: Record<string, number | null> = {}
        entries.forEach(e => { avgMap[e.id] = e.avg })
        setPeerAverages(avgMap)
      }
    }
    void loadCategorySkills()
  }, [selectedCategoryId, user, selfRatings])

  // Load histories per skill when in history mode
  useEffect(() => {
    const loadHist = async () => {
      if (!user || mode !== 'history' || !skills.length) return
      const entries = await Promise.all(
        skills.map(async (sk) => ({ id: sk.id, rows: await getHistory(user.id, sk.id) }))
      )
      const map: Record<string, Array<{ rating: number; comment: string | null; validFrom: string }>> = {}
      for (const e of entries) map[e.id] = e.rows
      setHistories(map)
    }
    void loadHist()
  }, [mode, user, skills])


  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-4 border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-3">Meine Kategorien</h2>
        <CategoryNav nodes={tree} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />
      </aside>

      <section className="col-span-8 border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            {mode === 'history' ? 'Historie' : 'Selbsteinschätzung'}
            {mode === 'form' && (
              <div className="relative group inline-flex items-center">
                <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-semibold rounded-full border text-gray-700 bg-white">i</span>
                <div className="hidden group-hover:block absolute left-6 top-1 z-10 w-64 bg-white border rounded shadow p-2 text-xs text-gray-700">
                  <div className="font-semibold mb-1">Bewertungslegende</div>
                  <ul className="list-disc ml-4 space-y-0.5">
                    <li>1–2: Sehr geringe Kenntnisse, Grundlagen kaum vorhanden</li>
                    <li>3–4: Erste Kenntnisse, einfache Aufgaben mit Anleitung</li>
                    <li>5–6: Solide Kenntnisse, Standardaufgaben selbstständig</li>
                    <li>7–8: Fortgeschritten, komplexe Aufgaben sicher</li>
                    <li>9–10: Experte, Referenzperson/Coach</li>
                  </ul>
                </div>
              </div>
            )}
          </h2>
        </div>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {!selectedCategory && <div className="text-sm text-gray-500">Kategorie wählen</div>}
        {selectedCategory && mode === 'form' && (
          <>
            <div className="text-sm text-gray-600 mb-3">Bitte alle Skills ausfüllen. "Unbekannt" ist erlaubt, um später Historie aufzubauen.</div>
            
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 text-center border-r text-xs uppercase tracking-wide text-gray-600 font-semibold rounded-l-md">Skill</th>
                  <th className="py-2 px-3 text-center border-r w-28 text-xs uppercase tracking-wide text-gray-600 font-semibold">Letzte</th>
                  <th className="py-2 px-3 text-center border-r text-xs uppercase tracking-wide text-gray-600 font-semibold">
                    <div className="inline-flex items-center gap-2 justify-center">
                      <span>Unbekannt</span>
                      <span className="relative group inline-flex items-center">
                        <span className="w-4 h-4 inline-flex items-center justify-center text-[10px] font-semibold rounded-full border text-gray-700 bg-white">i</span>
                        <div className="hidden group-hover:block absolute left-5 top-0 z-10 w-60 bg-white border rounded shadow p-2 text-xs text-gray-700">
                          Setze dieses Feld, wenn dir der Skill gänzlich unbekannt ist. Die Bewertung wird auf 0 gesetzt und der Slider deaktiviert.
                        </div>
                      </span>
                    </div>
                  </th>
                  <th className="py-2 px-3 text-center border-r text-xs uppercase tracking-wide text-gray-600 font-semibold">Neue Bewertung</th>
                  <th className="py-2 px-3 text-center text-xs uppercase tracking-wide text-gray-600 font-semibold rounded-r-md">Ø Fremd</th>
                </tr>
              </thead>
              <tbody>
                {skills.map(sk => (
                  <tr key={sk.id} className="border-b">
                    <td className="py-2 align-top">
                      <div className="font-medium">{sk.name}</div>
                      <div className="text-xs text-gray-600">{sk.description}</div>
                    </td>
                    <td className="py-2 align-top w-28 text-center">{formatLastSelfRating(selfRatings[sk.id])}</td>
                    <td className="py-2 align-top text-center">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={(formValues[sk.id]?.rating ?? 0) === 0}
                          onChange={(e) =>
                            setFormValues(p => ({
                              ...p,
                              [sk.id]: { ...(p[sk.id] ?? { comment: '' }), rating: e.target.checked ? 0 : 1 },
                            }))
                          }
                        />
                      </label>
                    </td>
                    <td className="py-2 align-top">
                      <div className="flex items-center justify-center">
                        <SkillRatingInput
                          value={formValues[sk.id]?.rating ?? 0}
                          onChange={(v) => setFormValues(p => ({ ...p, [sk.id]: { ...(p[sk.id] ?? { comment: '' }), rating: v } }))}
                          disabled={(formValues[sk.id]?.rating ?? 0) === 0}
                        />
                      </div>
                    </td>
                    <td className="py-2">{peerAverages[sk.id] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-3">
              <button
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                onClick={async () => {
                  if (!user) return
                  setError(null)
                  for (const sk of skills) {
                    const val = formValues[sk.id]
                    if (!val) continue
                    setSaving(prev => ({ ...prev, [sk.id]: true }))
                    try {
                      await createAssessment({
                        employeeId: user.id,
                        skillId: sk.id,
                        assessmentType: 'SELF',
                        rating: val.rating,
                        comment: val.comment?.trim() ? val.comment : undefined,
                      })
                      setSelfRatings(prev => ({ ...prev, [sk.id]: { rating: val.rating, comment: val.comment || null } }))
                    } catch {
                      setError('Einige Bewertungen konnten nicht gespeichert werden.')
                    } finally {
                      setSaving(prev => ({ ...prev, [sk.id]: false }))
                    }
                  }
                }}
              >
                Alle speichern
              </button>
            </div>
          </>
        )}

        {selectedCategory && mode === 'history' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">Vergangene Einträge, neueste zuerst.</div>
            {skills.map((sk) => {
              const rows = (histories[sk.id] ?? []).slice().sort((a, b) => (a.validFrom > b.validFrom ? -1 : 1))
              return (
                <div key={sk.id} className="border rounded p-3">
                  <div className="font-semibold mb-2">{sk.name}</div>
                  {rows.length === 0 ? (
                    <div className="text-sm text-gray-500">Keine Einträge</div>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {rows.map((r, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span className="text-gray-600">{new Date(r.validFrom).toLocaleString()}</span>
                          <span className="font-medium">{r.rating}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function CategoryNav(props: { nodes: CategoryTree[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const { nodes, selectedId, onSelect } = props
  return (
    <ul className="space-y-1 text-sm">
      {nodes.map((n) => (
        <li key={n.id}>
          <button
            className={(selectedId === n.id ? 'bg-gray-100 ' : '') + 'w-full text-left px-2 py-1 rounded'}
            onClick={() => onSelect(n.id)}
          >
            {n.name}
          </button>
          {n.children?.length ? (
            <div className="ml-4">
              <CategoryNav nodes={n.children} selectedId={selectedId} onSelect={onSelect} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
