import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchCategoriesTree, fetchSkills, CategoryTree, SkillSummary } from '@/services/skill.service'
import { listForEmployee, createAssessment, getPeerAverage } from '@/services/assessment.service'
import { SkillRatingInput } from '@/components/SkillRatingInput'

export default function EmployeeProfilePage() {
  const { employeeId = '' } = useParams()
  const { user } = useAuth()
  const [tree, setTree] = useState<CategoryTree[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [selfRatings, setSelfRatings] = useState<Record<string, number>>({})
  const [myPeerRatings, setMyPeerRatings] = useState<Record<string, number>>({})
  const [averages, setAverages] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const selectedCategory = useMemo(() => {
    const map = new Map<string, CategoryTree>()
    const walk = (nodes: CategoryTree[]) => nodes.forEach(n => { map.set(n.id, n); if (n.children?.length) walk(n.children) })
    walk(tree)
    return selectedCategoryId ? map.get(selectedCategoryId) || null : null
  }, [tree, selectedCategoryId])

  useEffect(() => {
    void (async () => {
      const t = await fetchCategoriesTree()
      setTree(t)
    })()
  }, [])

  useEffect(() => {
    if (!employeeId) return
    void (async () => {
      const summary = await listForEmployee(employeeId)
      const self: Record<string, number> = {}
      const mine: Record<string, number> = {}
      summary.forEach(s => {
        if (s.selfRating) self[s.skill.id] = s.selfRating.rating
        const my = s.peerRatings.find(r => r.assessor.id === user?.id)
        if (my) mine[s.skill.id] = my.rating
      })
      setSelfRatings(self)
      setMyPeerRatings(mine)
    })()
  }, [employeeId, user?.id])

  useEffect(() => {
    if (!selectedCategoryId || !employeeId) { setSkills([]); return }
    void (async () => {
      const s = await fetchSkills({ categoryId: selectedCategoryId, isActive: true })
      setSkills(s)
      const entries = await Promise.all(s.map(async (sk: SkillSummary) => ({ id: sk.id, avg: await getPeerAverage(employeeId, sk.id) })))
      const avgMap: Record<string, number | null> = {}
      entries.forEach(e => { avgMap[e.id] = e.avg })
      setAverages(avgMap)
    })()
  }, [selectedCategoryId, employeeId])

  const saveDebounced: Record<string, NodeJS.Timeout> = {}

  const onChangePeer = (skillId: string, rating: number) => {
    setMyPeerRatings(prev => ({ ...prev, [skillId]: rating }))
    setSaving(prev => ({ ...prev, [skillId]: true }))
    if (saveDebounced[skillId]) clearTimeout(saveDebounced[skillId])
    saveDebounced[skillId] = setTimeout(async () => {
      try {
        await createAssessment({ employeeId, skillId, assessmentType: 'PEER', rating })
      } finally {
        setSaving(prev => ({ ...prev, [skillId]: false }))
      }
    }, 500)
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-4 border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-3">Mitarbeiter</h2>
        {employeeId}
        <h3 className="font-semibold mt-4 mb-2">Kategorien</h3>
        <CategoryNav nodes={tree} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />
      </aside>

      <section className="col-span-8 border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-3">Fremdeinschätzung</h2>
        {!selectedCategory && <div className="text-sm text-gray-500">Kategorie wählen</div>}
        {selectedCategory && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Skill</th>
                <th className="py-2">Selbst</th>
                <th className="py-2">Meine Fremd</th>
                <th className="py-2">Ø Fremd</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(sk => (
                <tr key={sk.id} className="border-b">
                  <td className="py-2">{sk.name}</td>
                  <td className="py-2">{selfRatings[sk.id] ?? '—'}</td>
                  <td className="py-2">
                    <SkillRatingInput value={myPeerRatings[sk.id] ?? 5} onChange={(v) => onChangePeer(sk.id, v)} showScale />
                    {saving[sk.id] && <span className="text-xs text-gray-500 ml-2">Speichere…</span>}
                  </td>
                  <td className="py-2">{averages[sk.id] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function CategoryNav(props: { nodes: CategoryTree[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const { nodes, selectedId, onSelect } = props
  return (
    <ul className="space-y-1 text-sm">
      {nodes.map(n => (
        <li key={n.id}>
          <button className={`w-full text-left px-2 py-1 rounded ${selectedId === n.id ? 'bg-gray-100' : ''}`} onClick={() => onSelect(n.id)}>
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
