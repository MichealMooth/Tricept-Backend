import { useEffect, useMemo, useState } from 'react'
import { fetchOverview } from '@/services/capacity.service'

const monthLabels = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function capacityColor(percent: number | null | undefined) {
  if (percent == null) return '#f3f4f6'
  const p = Math.max(0, Math.min(100, percent))
  const stops = [
    { p: 0, c: [0xd5, 0x6a, 0x6a] },
    { p: 50, c: [0xe3, 0xc8, 0x6e] },
    { p: 100, c: [0x6c, 0xbf, 0x74] },
  ]
  let a = stops[0], b = stops[2]
  if (p <= 50) { a = stops[0]; b = stops[1] } else { a = stops[1]; b = stops[2] }
  const t = (p - a.p) / (b.p - a.p)
  const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t)
  const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t)
  const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

export default function CapacityOverviewPage() {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(thisYear)
  const [rows, setRows] = useState<Array<{ userId: string; name: string; isActive: boolean; months: Array<number | null> }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  const yearOptions = useMemo(() => [thisYear, thisYear + 1], [thisYear])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setErrorDetail(null)
      const data = await fetchOverview(year)
      setRows(data)
    } catch (e: any) {
      const status = e?.response?.status
      const msg = e?.response?.data?.message || e?.message
      setError('Laden fehlgeschlagen')
      setErrorDetail(status ? `HTTP ${status}: ${msg}` : String(msg || 'Unbekannter Fehler'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [year])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kapazitäten Gesamtübersicht</h1>
          <p className="text-sm text-gray-600">Auslastung je Nutzer und Monat.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Jahr</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-2 py-1 border rounded">
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Laden…</div>}
      {error && (
        <div className="text-sm text-red-600 flex items-center justify-between">
          <div>
            {error}
            {errorDetail && <div className="text-xs text-red-500 mt-1">{errorDetail}</div>}
          </div>
          <button onClick={load} className="ml-4 px-2 py-1 rounded border hover:bg-gray-50">Erneut versuchen</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-2 text-left min-w-[16rem]">User</th>
              {monthLabels.map((ml) => (
                <th key={ml} className="px-2 py-2 text-center min-w-[6rem]">{ml}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b">
                <td className="px-3 py-2 whitespace-nowrap">{r.name}{!r.isActive && <span className="ml-2 text-xs text-gray-500">(inaktiv)</span>}</td>
                {r.months.map((p, idx) => (
                  <td key={idx} className="px-2 py-2 text-center">
                    <div className="rounded px-2 py-1" style={{ background: capacityColor(p) }}>{p ?? '—'}{p!=null && '%'}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
