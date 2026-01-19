import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchUserCapacities, saveUserMonthCapacity, type UserCapacity, type CapacityAllocation } from '@/services/capacity.service'

const monthLabels = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

// Soft gradient from red -> yellow -> green
function capacityColor(percent: number | null | undefined) {
  if (percent == null) return '#f5f6f8' // slightly lighter gray
  const p = Math.max(0, Math.min(100, percent))
  // Interpolate between stops (muted base colors):
  // 0% -> soft red, 50% -> soft amber, 100% -> soft green
  const stops = [
    { p: 0, c: [0xf2, 0x99, 0x99] },     // #f29999
    { p: 50, c: [0xf2, 0xe2, 0x9c] },    // #f2e29c
    { p: 100, c: [0x9f, 0xd3, 0xa9] },   // #9fd3a9
  ]
  let a = stops[0], b = stops[2]
  if (p <= 50) { a = stops[0]; b = stops[1] } else { a = stops[1]; b = stops[2] }
  const t = (p - a.p) / (b.p - a.p)
  let r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t)
  let g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t)
  let bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t)
  // Blend with white for a modern, pastel look
  const mix = 0.6 // 60% white
  r = Math.round(255 * mix + r * (1 - mix))
  g = Math.round(255 * mix + g * (1 - mix))
  bl = Math.round(255 * mix + bl * (1 - mix))
  return `rgb(${r}, ${g}, ${bl})`
}

export default function MyCapacityPage() {
  const { user } = useAuth()
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1 // 1-12
  const [year, setYear] = useState<number>(thisYear)
  const [rows, setRows] = useState<Record<number, UserCapacity | null>>({})
  // Draft allocations per month (multiple entries allowed)
  const [allocationsDraft, setAllocationsDraft] = useState<Record<number, CapacityAllocation[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const yearOptions = useMemo(() => [thisYear, thisYear + 1], [thisYear])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        setError(null)
        setSuccess(null)
        const data = await fetchUserCapacities(user.id, year)
        const map: Record<number, UserCapacity | null> = {}
        for (let m = 1; m <= 12; m++) map[m] = null
        for (const c of data) map[c.month] = c
        setRows(map)
        // Initialize drafts from existing allocations or empty array
        const drafts: Record<number, CapacityAllocation[]> = {}
        for (let m = 1; m <= 12; m++) drafts[m] = (map[m]?.allocations as CapacityAllocation[] | undefined) ? [...(map[m]!.allocations as CapacityAllocation[])] : []
        setAllocationsDraft(drafts)
      } catch (e) {
        setError('Laden der Kapazitäten fehlgeschlagen (bitte anmelden und Backend prüfen).')
      }
    }
    void load()
  }, [user, year])

  // Helpers
  const monthTotal = (m: number) => (allocationsDraft[m] ?? []).reduce((s, a) => s + (Number(a.percent) || 0), 0)
  const clamp0_100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

  const onSaveAll = async () => {
    if (!user) return
    setError(null)
    setSuccess(null)
    try {
      for (let m = 1; m <= 12; m++) {
        const list = (allocationsDraft[m] ?? [])
          .map(a => ({ project_name: a.project_name?.trim() || undefined, percent: clamp0_100(Number(a.percent) || 0) }))
          .filter(a => (a.percent ?? 0) > 0)
        const totalPercent = clamp0_100(list.reduce((s, a) => s + a.percent, 0))
        const saved = await saveUserMonthCapacity({ userId: user.id, year, month: m, allocations: list, totalPercent })
        setRows((r) => ({ ...r, [m]: saved }))
      }
      setSuccess('Alle Monate gespeichert')
    } catch (e) {
      setError('Speichern fehlgeschlagen')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meine Kapazitäten</h1>
          <p className="text-sm text-gray-600">Erfasse deine monatliche Auslastung.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Jahr</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-2 py-1 border rounded"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-emerald-700">{success}</div>}

      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const cap = rows[month]
            const total = monthTotal(month)
            const bg = capacityColor(total)
            const isPast = year < thisYear || (year === thisYear && month < thisMonth)
            return (
              <div
                key={month}
                className="rounded border shadow-sm overflow-hidden text-[12px] flex flex-col"
                style={{
                  backgroundColor: bg,
                  backgroundImage: isPast
                    ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.45) 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)'
                    : undefined,
                }}
              >
                <div className="px-2 py-1 border-b bg-gray-50 font-medium flex items-center justify-between">
                  <span className="truncate">{monthLabels[month-1]} {month === 1 && `(KW ${year})`}</span>
                  <span className="text-[10px] text-gray-600">{total}%</span>
                </div>
                <div className={`p-1.5 space-y-1 ${isPast ? 'opacity-60 grayscale' : ''} flex-1 min-h-24`}>
                  {(allocationsDraft[month] ?? []).map((a, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={a.percent ?? 0}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setAllocationsDraft(d => ({ ...d, [month]: d[month].map((x, i) => i===idx ? { ...x, percent: clamp0_100(Number(e.target.value) || 0) } : x) }))}
                        className="w-14 px-1.5 py-0.5 border rounded bg-transparent disabled:opacity-60 text-[12px]"
                        disabled={isPast}
                      />
                      <span className="text-[10px] text-gray-700">%</span>
                      <select
                        disabled={isPast}
                        value={a.project_name ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setAllocationsDraft(d => ({ ...d, [month]: d[month].map((x, i) => i===idx ? { ...x, project_name: e.target.value || undefined } : x) }))}
                        className="flex-1 min-w-0 px-2 py-0.5 border rounded bg-transparent disabled:opacity-60 text-[12px]"
                      >
                        <option value="">Projekt (optional)</option>
                        <option value="Projekt A">Projekt A</option>
                        <option value="Projekt B">Projekt B</option>
                        <option value="Projekt C">Projekt C</option>
                      </select>
                      {!isPast && (
                        <button
                          onClick={() => setAllocationsDraft(d => ({ ...d, [month]: d[month].filter((_, i) => i !== idx) }))}
                          className="px-2 py-0.5 rounded border text-[11px] bg-transparent hover:bg-white/10"
                          title="Eintrag entfernen"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {!isPast && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => setAllocationsDraft(d => ({ ...d, [month]: [...(d[month] ?? []), { percent: 0 } as CapacityAllocation] }))}
                        className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow text-[11px]"
                      >
                        + Eintrag
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] text-gray-700">Summe: {total}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onSaveAll} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow text-[13px]">Alle speichern</button>
      </div>
    </div>
  )
}
