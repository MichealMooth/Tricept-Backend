import { useEffect, useMemo, useState } from 'react'
import { getTableInfo, getTableRows, listTables, type TableInfo } from '@/services/db-admin.service'

export default function DatabaseBrowserPage() {
  const [tables, setTables] = useState<string[]>([])
  const [active, setActive] = useState<string>('')
  const [info, setInfo] = useState<TableInfo | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)
  const [errorRows, setErrorRows] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const t = await listTables()
        setTables(t)
        if (t.length && !active) setActive(t[0])
      } catch (e: any) {
        setErrorInfo(e?.response?.data?.message || e?.message || 'Fehler beim Laden der Tabellen')
      }
    }
    void init()
  }, [])

  useEffect(() => {
    let aborted = false
    const token = Symbol('load')
    ;(async () => {
      if (!active) return
      try {
        setLoadingInfo(true)
        setErrorInfo(null)
        const ti = await getTableInfo(active)
        if (aborted) return
        setInfo(ti)
      } catch (e: any) {
        if (aborted) return
        setErrorInfo(e?.response?.data?.message || e?.message || 'Fehler beim Laden der Spalten')
        setInfo(null)
      } finally {
        if (!aborted) setLoadingInfo(false)
      }

      try {
        setLoadingRows(true)
        setErrorRows(null)
        const { rows } = await getTableRows(active, { limit, offset })
        if (aborted) return
        setRows(rows)
      } catch (e: any) {
        if (aborted) return
        setErrorRows(e?.response?.data?.message || e?.message || 'Fehler beim Laden der Daten')
        setRows([])
      } finally {
        if (!aborted) setLoadingRows(false)
      }
    })()
    return () => {
      aborted = true
    }
  }, [active, limit, offset])

  const canPrev = useMemo(() => offset > 0, [offset])
  const canNext = useMemo(() => (info?.count ?? 0) > offset + limit, [info, offset, limit])

  return (
    <div className="flex gap-4">
      <aside className="w-64 shrink-0 rounded-lg bg-white shadow-soft ring-1 ring-black/5 p-3 h-fit max-h-[70vh] overflow-auto">
        <div className="text-sm font-semibold mb-2">Tabellen</div>
        <ul className="space-y-1">
          {tables.map((t) => (
            <li key={t}>
              <button
                className={`w-full text-left px-2 py-1 rounded hover:bg-gray-50 ${active === t ? 'bg-gray-100 font-medium' : ''}`}
                onClick={() => { setActive(t); setOffset(0) }}
              >{t}</button>
            </li>
          ))}
          {tables.length === 0 && <li className="text-sm text-gray-600">Keine Tabellen gefunden</li>}
        </ul>
      </aside>

      <main className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Datenbank (Admin)</h1>
            <p className="text-sm text-gray-600">Tabellarische Ansicht aller gespeicherten Daten. Wählt automatisch neue Tabellen mit aus.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Limit</label>
            <input type="number" className="w-24 border rounded px-2 py-1" value={limit} onChange={(e) => setLimit(Math.min(Math.max(Number(e.target.value) || 1, 1), 1000))} />
          </div>
        </div>

        {errorInfo && <div className="text-sm text-red-600">{errorInfo}</div>}
        {loadingInfo && <div className="text-sm text-gray-600">Lade Spalten…</div>}

        {info && (
          <div className="rounded-lg bg-white shadow-soft ring-1 ring-black/5">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div className="font-medium">{active} <span className="text-sm text-gray-600">({info.count} Einträge)</span></div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setOffset((o) => Math.max(o - limit, 0))} disabled={!canPrev}>Zurück</button>
                <button className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setOffset((o) => o + limit)} disabled={!canNext}>Weiter</button>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {info.columns.map((c) => (
                      <th key={c.name} className="px-3 py-2 text-left whitespace-nowrap">{c.name}<div className="text-xs text-gray-500">{c.type}</div></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-b">
                      {info.columns.map((c) => (
                        <td key={c.name} className="px-3 py-2 align-top">
                          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r[c.name], null, 0)}</pre>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {loadingRows && (
                    <tr><td className="px-3 py-6 text-gray-600" colSpan={info.columns.length}>Lade Daten…</td></tr>
                  )}
                  {!loadingRows && errorRows && (
                    <tr><td className="px-3 py-6 text-red-600" colSpan={info.columns.length}>{errorRows}</td></tr>
                  )}
                  {!loadingRows && !errorRows && rows.length === 0 && (
                    <tr><td className="px-3 py-6 text-gray-600" colSpan={info.columns.length}>Keine Daten vorhanden.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
