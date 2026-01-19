import { useEffect, useMemo, useState } from 'react'
import { getMatrix, type MatrixData } from '@/services/matrix.service'
import { MatrixFilters } from '@/components/matrix/MatrixFilters'
import { SkillMatrix } from '@/components/matrix/SkillMatrix'
import { ExportButton } from '@/components/matrix/ExportButton'

export default function MatrixPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'GAP' | 'EXPERT'>('ALL')
  const [data, setData] = useState<MatrixData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const d = await getMatrix({ categoryId: categoryId ?? undefined })
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => { void load() }, 300)
    return () => clearTimeout(t)
  }, [categoryId])

  const filtered = useMemo(() => {
    if (!data) return null
    if (ratingFilter === 'ALL') return data
    const pass = (val: number | null) => {
      if (val == null) return false
      if (ratingFilter === 'GAP') return val < 5
      if (ratingFilter === 'EXPERT') return val >= 9
      return true
    }
    return {
      ...data,
      data: data.data.filter((c) => pass(c.selfRating)),
    }
  }, [data, ratingFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MatrixFilters
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          employeeIds={[]}
          onEmployeeIdsChange={() => {}}
          ratingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
        />
        <ExportButton currentCategoryId={categoryId} />
      </div>

      {loading && <div className="text-sm text-gray-600">Lade Matrix…</div>}
      {filtered && <SkillMatrix data={filtered} />}
    </div>
  )
}
