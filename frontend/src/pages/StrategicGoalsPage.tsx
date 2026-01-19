import { useEffect, useMemo, useState } from 'react'
import { listGoalsWithMyRatings, upsertMyRating, fetchAverages } from '@/services/strategic-goals.service'

const COLORS = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-amber-400',
  4: 'bg-lime-400',
  5: 'bg-green-500',
} as const

export default function StrategicGoalsPage() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [items, setItems] = useState<Array<{ goal: { id: string; title: string; description?: string | null }; rating: any | null }>>([])
  const [averages, setAverages] = useState<Record<string, { avg: number | null; count: number }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [mine, avgs] = await Promise.all([
          listGoalsWithMyRatings({ year, month }),
          fetchAverages({ year, month }),
        ])
        setItems(mine.items)
        const map: Record<string, { avg: number | null; count: number }> = {}
        for (const r of avgs.items) map[r.goalId] = { avg: r.avg, count: r.count }
        setAverages(map)
      } catch (e) {
        setError('Laden fehlgeschlagen')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [year, month])

  const isCurrent = useMemo(() => year === now.getFullYear() && month === (now.getMonth() + 1), [year, month])

  const onRate = async (goalId: string, value: number) => {
    if (!isCurrent) return
    try {
      setSaving((s) => ({ ...s, [goalId]: true }))
      await upsertMyRating({ goalId, rating: value, year, month })
      setItems((arr) => arr.map((x) => (x.goal.id === goalId ? { ...x, rating: { ...(x.rating ?? {}), rating: value } } : x)))
      setEditing((m) => ({ ...m, [goalId]: false }))
      // refresh averages after rating
      try {
        const avgs = await fetchAverages({ year, month })
        const map: Record<string, { avg: number | null; count: number }> = {}
        for (const r of avgs.items) map[r.goalId] = { avg: r.avg, count: r.count }
        setAverages(map)
      } catch {}
    } catch (e) {
      setError('Speichern fehlgeschlagen')
    } finally {
      setSaving((s) => ({ ...s, [goalId]: false }))
    }
  }

  const monthName = useMemo(() => new Date(year, month - 1, 1).toLocaleString('de-DE', { month: 'long' }), [year, month])

  const changeMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Strategische Ziele</h1>
          <p className="text-sm text-gray-600">Bewerte den Stand der Ziele für {monthName} {year}.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => changeMonth(-1)} title="Monat zurück">◀</button>
          <div className="text-sm w-36 text-center">{monthName} {year}</div>
          <button className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => changeMonth(1)} title="Monat vor">▶</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <div>Wird geladen…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr">
          {items.map(({ goal, rating }) => (
            <div key={goal.id} className="rounded-lg bg-white p-4 shadow-soft ring-1 ring-black/5 flex flex-col h-full min-h-[170px]">
              <div className="flex-1">
                <div className="font-medium text-primary_dark">{goal.title}</div>
                {goal.description && <div className="text-sm text-gray-600 mt-1">{goal.description}</div>}
              </div>
              <div className="mt-5 flex items-center gap-3 mt-auto">
                {(() => {
                  const hasRated = !!rating?.rating
                  // Show rating bubbles only if current month AND not yet rated
                  if (isCurrent && (!hasRated || editing[goal.id])) {
                    return (
                      <div className="flex items-center gap-3">
                        {[1,2,3,4,5].map((v) => (
                          <button
                            key={v}
                            onClick={() => onRate(goal.id, v)}
                            className={`h-6 w-6 rounded-full ring-1 ring-black/10 ${COLORS[v as 1|2|3|4|5]} ${rating?.rating === v ? 'scale-110 outline outline-2 outline-black/10' : 'opacity-80 hover:opacity-100'} transition`}
                            disabled={!!saving[goal.id]}
                            title={`Wertung ${v}`}
                          />
                        ))}
                      </div>
                    )
                  }

                  // Otherwise: show average dot only (gray if no votes)
                  const avg = averages[goal.id]?.avg
                  const rounded = avg ? Math.round(avg as number) : null
                  const color = rounded ? COLORS[rounded as 1|2|3|4|5] : 'bg-gray-300'
                  const title = avg ? `Durchschnitt ${avg.toFixed(2)} (${averages[goal.id]?.count} Stimmen)` : 'Noch keine Stimmen'
                  return (
                    <>
                      <div className={`h-6 w-6 rounded-full ring-1 ring-black/10 ${color}`} title={title} />
                      {isCurrent && hasRated && (
                        <button
                          className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          title="Bewertung ändern"
                          onClick={() => setEditing((m) => ({ ...m, [goal.id]: true }))}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm18-11.5a1.003 1.003 0 0 0 0-1.42l-1.59-1.59a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75L21 5.75z" />
                          </svg>
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-gray-600">Keine aktiven Ziele vorhanden.</div>}
        </div>
      )}
    </div>
  )
}
