import { useEffect, useState } from 'react'
import { fetchCategoriesTree } from '@/services/skill.service'

export function MatrixFilters(props: {
  categoryId: string | null
  onCategoryChange: (id: string | null) => void
  employeeIds: string[]
  onEmployeeIdsChange: (ids: string[]) => void
  ratingFilter: 'ALL' | 'GAP' | 'EXPERT'
  onRatingFilterChange: (f: 'ALL' | 'GAP' | 'EXPERT') => void
}) {
  const { categoryId, onCategoryChange, ratingFilter, onRatingFilterChange } = props
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    void (async () => {
      const tree = await fetchCategoriesTree()
      const flat: { id: string; name: string }[] = []
      const walk = (nodes: any[], prefix = '') => {
        for (const n of nodes) {
          flat.push({ id: n.id, name: prefix ? `${prefix} / ${n.name}` : n.name })
          if (n.children?.length) walk(n.children, prefix ? `${prefix} / ${n.name}` : n.name)
        }
      }
      walk(tree)
      setCategories(flat)
    })()
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div>
        <label className="text-xs block mb-1">Kategorie</label>
        <select
          className="border rounded px-2 py-1"
          value={categoryId ?? ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
        >
          <option value="">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs block mb-1">Rating Filter</label>
        <select className="border rounded px-2 py-1" value={ratingFilter} onChange={(e) => onRatingFilterChange(e.target.value as any)}>
          <option value="ALL">Alle</option>
          <option value="GAP">Nur Gaps (&lt;5)</option>
          <option value="EXPERT">Nur Experten (9-10)</option>
        </select>
      </div>
    </div>
  )
}
