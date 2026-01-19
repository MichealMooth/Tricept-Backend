import { useEffect, useMemo, useState } from 'react'
import { listEmployees, type Employee } from '@/services/employee.service'
import { fetchCategoriesTree, fetchSkills, type CategoryTree, type SkillSummary } from '@/services/skill.service'
import { listForEmployee as listAssessments, createAssessment } from '@/services/assessment.service'
import { SkillRatingInput } from '@/components/SkillRatingInput'

export default function AssessEmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState<string>('')
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [assessments, setAssessments] = useState<Record<string, { self: { rating: number | null; comment: string | null } | null; peers: { assessor: { id: string; firstName: string; lastName: string; email: string }; rating: number; comment: string | null }[] }>>({})

  // My input states per skill
  const [myInput, setMyInput] = useState<Record<string, { rating: number; comment: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const init = async () => {
      const [emps, cats] = await Promise.all([listEmployees(''), fetchCategoriesTree()])
      setEmployees(emps)
      setCategories(cats)
    }
    void init()
  }, [])

  const selectedCategory = useMemo(() => {
    if (!categoryId) return null
    const stack: CategoryTree[] = [...categories]
    const map = new Map<string, CategoryTree>()
    while (stack.length) {
      const c = stack.pop()!
      map.set(c.id, c)
      for (const ch of c.children || []) stack.push(ch as any)
    }
    return map.get(categoryId) ?? null
  }, [categories, categoryId])

  useEffect(() => {
    const load = async () => {
      if (!employeeId) return
      setLoading(true)
      try {
        const data = await listAssessments(employeeId, false)
        const map: typeof assessments = {}
        for (const row of data) {
          map[row.skill.id] = {
            self: row.selfRating ? { rating: row.selfRating.rating, comment: row.selfRating.comment } : null,
            peers: row.peerRatings,
          }
        }
        setAssessments(map)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [employeeId])

  useEffect(() => {
    const loadSkills = async () => {
      if (!selectedCategory) return setSkills([])
      const s = await fetchSkills({ categoryId, isActive: true })
      setSkills(s)
    }
    void loadSkills()
  }, [categoryId, selectedCategory])

  const startRate = (skillId: string) => {
    setMyInput((prev) => ({ ...prev, [skillId]: prev[skillId] ?? { rating: 5, comment: '' } }))
  }

  const save = async (skillId: string) => {
    if (!employeeId) return
    const input = myInput[skillId]
    if (!input) return
    setSaving((p) => ({ ...p, [skillId]: true }))
    try {
      await createAssessment({
        employeeId,
        skillId,
        assessmentType: 'PEER',
        rating: input.rating,
        comment: input.comment && input.comment.trim() ? input.comment : undefined,
      })
      // Update list locally: push my comment/rating into peers
      setAssessments((prev) => {
        const existing = prev[skillId] ?? { self: null, peers: [] as any[] }
        const updated = { ...existing, peers: [{ assessor: { id: 'me', firstName: '', lastName: '', email: '' }, rating: input.rating, comment: input.comment && input.comment.trim() ? input.comment : null }, ...existing.peers] }
        return { ...prev, [skillId]: updated }
      })
    } finally {
      setSaving((p) => ({ ...p, [skillId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Mitarbeiter bewerten</h2>

      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-sm mb-1">Mitarbeiter</label>
          <select className="border rounded px-3 py-2 min-w-[260px]" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Bitte wählen…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.lastName}, {e.firstName} – {e.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Kategorie</label>
          <select className="border rounded px-3 py-2 min-w-[260px]" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Bitte wählen…</option>
            {categories.flatMap((c) => flattenCategories(c)).map((c) => (
              <option key={c.id} value={c.id}>{c.path}</option>
            ))}
          </select>
        </div>
      </div>

      {!employeeId && <div className="text-sm text-gray-600">Bitte zuerst einen Mitarbeiter auswählen.</div>}

      {employeeId && selectedCategory && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-2 px-2">Skill</th>
                <th className="py-2 px-2">Meine Bewertung</th>
                <th className="py-2 px-2 w-64">Kommentar</th>
                <th className="py-2 px-2 w-40">Aktionen</th>
                <th className="py-2 px-2 w-16">Info</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => {
                const a = assessments[s.id]
                const comments = (a?.peers || []).map((p) => p.comment).filter((c): c is string => !!c)
                const my = myInput[s.id]
                return (
                  <tr key={s.id} className="border-b">
                    <td className="py-2 px-2 align-top">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-600">{s.description}</div>
                    </td>
                    <td className="py-2 px-2 align-top">
                      {my ? (
                        <SkillRatingInput value={my.rating} onChange={(v) => setMyInput((p) => ({ ...p, [s.id]: { ...(p[s.id] ?? { comment: '' }), rating: v } }))} />
                      ) : (
                        <button className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow" onClick={() => startRate(s.id)}>Bewerten</button>
                      )}
                    </td>
                    <td className="py-2 px-2 align-top">
                      {my ? (
                        <textarea
                          className="w-full border rounded px-2 py-1"
                          placeholder="Optionaler Kommentar"
                          rows={2}
                          value={my.comment}
                          onChange={(e) => setMyInput((p) => ({ ...p, [s.id]: { ...(p[s.id] ?? { rating: 5 }), comment: e.target.value } }))}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 align-top">
                      {my ? (
                        <button disabled={saving[s.id]} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-60" onClick={() => save(s.id)}>
                          Speichern
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 align-top">
                      {comments.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : comments.length === 1 ? (
                        <InfoIcon title={comments[0]} />
                      ) : (
                        <CommentsButton comments={a!.peers.filter(p => p.comment).map(p => ({
                          author: `${p.assessor.firstName} ${p.assessor.lastName}`.trim() || p.assessor.email,
                          text: p.comment as string,
                        }))} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function flattenCategories(node: CategoryTree, path = ''): { id: string; path: string }[] {
  const currentPath = path ? `${path} / ${node.name}` : node.name
  const arr: { id: string; path: string }[] = [{ id: node.id, path: currentPath }]
  for (const ch of node.children || []) arr.push(...flattenCategories(ch as any, currentPath))
  return arr
}

function InfoIcon({ title }: { title: string }) {
  return (
    <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-center leading-6 cursor-default" title={title}>
      i
    </span>
  )
}

function CommentsButton(props: { comments: { author: string; text: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="px-2 py-1 text-indigo-700 underline" onClick={() => setOpen(true)} title={`${props.comments.length} Kommentare anzeigen`}>
        info
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Kommentare ({props.comments.length})</h3>
              <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setOpen(false)}>Schließen</button>
            </div>
            <div className="max-h-[50vh] overflow-auto space-y-3">
              {props.comments.map((c, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">{c.author}</div>
                  <div className="whitespace-pre-wrap text-sm">{c.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
