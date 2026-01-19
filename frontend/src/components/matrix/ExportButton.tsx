import { useMemo, useState } from 'react'
import type { MatrixData } from '@/services/matrix.service'

declare global {
  interface Window { XLSX?: any }
}

export function ExportButton(props: { currentCategoryId: string | null; data?: MatrixData | null }) {
  const { currentCategoryId, data } = props
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<'VIEW' | 'ALL' | 'CATEGORY'>('VIEW')
  const [includeComments, setIncludeComments] = useState(true)
  const [loading, setLoading] = useState(false)

  const effectiveFilters = useMemo(() => {
    if (scope === 'ALL') return {}
    if (scope === 'CATEGORY') return { categoryId: currentCategoryId ?? undefined }
    // VIEW falls back to current category too for now
    return { categoryId: currentCategoryId ?? undefined }
  }, [scope, currentCategoryId])

  const onExport = async () => {
    setLoading(true)
    try {
      // Prefer client-side generation with SheetJS via CDN
      if (window.XLSX && data) {
        const XLSX = window.XLSX
        const wb = XLSX.utils.book_new()

        // Tab 1: Skill Matrix
        const header = ['Mitarbeiter', ...data.skills.map(s => s.name)]
        const rows: any[][] = []
        for (const e of data.employees) {
          const row: any[] = [`${e.lastName}, ${e.firstName}`]
          for (const s of data.skills) {
            const cell = data.data.find(c => c.employeeId === e.id && c.skillId === s.id)
            row.push(cell?.selfRating ?? '')
          }
          rows.push(row)
        }
        const ws1 = XLSX.utils.aoa_to_sheet([header, ...rows])
        ws1['!freeze'] = { xSplit: 1, ySplit: 1 }
        ws1['!cols'] = [{ wch: 26 }, ...data.skills.map(() => ({ wch: 10 }))]
        XLSX.utils.book_append_sheet(wb, ws1, 'Skill Matrix')

        // Tab 2: Bewertungen Details (ohne Kommentare, da clientseitig nicht geladen)
        const details: any[][] = [[
          'Mitarbeiter','Skill','Kategorie','Bewertungstyp','Bewerter','Rating','Kommentar','Datum'
        ]]
        // Minimal: aus current data nur Self/Peer aktuell (keine Historie/Kommentare)
        for (const e of data.employees) {
          for (const s of data.skills) {
            const cell = data.data.find(c => c.employeeId === e.id && c.skillId === s.id)
            if (!cell) continue
            details.push([
              `${e.lastName}, ${e.firstName}`,
              s.name,
              s.categoryName ?? '',
              'SELF',
              '',
              cell.selfRating ?? '',
              includeComments ? '' : '',
              cell.lastUpdated ?? '',
            ])
            details.push([
              `${e.lastName}, ${e.firstName}`,
              s.name,
              s.categoryName ?? '',
              'PEER',
              '—',
              cell.avgPeerRating ?? '',
              includeComments ? '' : '',
              cell.lastUpdated ?? '',
            ])
          }
        }
        const ws2 = XLSX.utils.aoa_to_sheet(details)
        ws2['!freeze'] = { xSplit: 0, ySplit: 1 }
        XLSX.utils.book_append_sheet(wb, ws2, 'Bewertungen Details')

        // Tab 3: Statistiken
        const bySkill = new Map<string, number[]>()
        for (const c of data.data) {
          if (c.avgPeerRating != null) {
            const arr = bySkill.get(c.skillId) ?? []
            arr.push(c.avgPeerRating)
            bySkill.set(c.skillId, arr)
          }
        }
        const skillAvg = data.skills.map(s => {
          const arr = bySkill.get(s.id) ?? []
          const avg = arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*100)/100 : null
          return { s, avg }
        })
        const byCat = new Map<string, number[]>()
        for (const k of skillAvg) { if (k.avg!=null) { const arr = byCat.get(k.s.categoryName ?? '') ?? []; arr.push(k.avg); byCat.set(k.s.categoryName ?? '', arr) } }
        const catRows = Array.from(byCat.entries()).map(([cat, arr]) => [cat || '—', Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*100)/100])
        const withAvg = skillAvg.filter(x => x.avg!=null) as {s: MatrixData['skills'][number]; avg: number}[]
        const top5 = [...withAvg].sort((a,b)=>b.avg-a.avg).slice(0,5).map(x=>[x.s.name, x.s.categoryName ?? '', x.avg])
        const bottom5 = [...withAvg].sort((a,b)=>a.avg-b.avg).slice(0,5).map(x=>[x.s.name, x.s.categoryName ?? '', x.avg])
        const experts = data.skills.map(s => {
          const cnt = data.data.filter(c => c.skillId===s.id && (c.selfRating ?? 0) >= 9).length
          return [s.name, s.categoryName ?? '', cnt]
        })
        const stats: any[][] = []
        stats.push(['Kategorie','Ø Fremd']); stats.push(...catRows); stats.push([])
        stats.push(['Top 5 Skills','Kategorie','Ø Fremd']); stats.push(...top5); stats.push([])
        stats.push(['Bottom 5 Skills','Kategorie','Ø Fremd']); stats.push(...bottom5); stats.push([])
        stats.push(['Experten (9-10) pro Skill','Kategorie','Anzahl']); stats.push(...experts)
        const ws3 = XLSX.utils.aoa_to_sheet(stats)
        XLSX.utils.book_append_sheet(wb, ws3, 'Statistiken')

        const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth()+1).padStart(2,'0'); const dd = String(today.getDate()).padStart(2,'0')
        XLSX.writeFile(wb, `Tricept_Skill_Matrix_${yyyy}-${mm}-${dd}.xlsx`)
        setOpen(false)
        return
      }

      // Fallback (should not be hit while backend route is disabled) – no-op
      alert('Export derzeit nur clientseitig verfügbar. Bitte die Matrix-Seite neu laden, damit Daten vorhanden sind.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="px-3 py-1 rounded border" onClick={() => setOpen(true)}>
        Export
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Excel-Export</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Umfang</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="scope" checked={scope==='VIEW'} onChange={() => setScope('VIEW')} />
                    <span>Aktuelle Ansicht</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="scope" checked={scope==='ALL'} onChange={() => setScope('ALL')} />
                    <span>Vollständige Matrix</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="scope" checked={scope==='CATEGORY'} onChange={() => setScope('CATEGORY')} />
                    <span>Nur gewählte Kategorie</span>
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeComments} onChange={(e) => setIncludeComments(e.target.checked)} />
                <span>Kommentare einbeziehen</span>
              </label>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 rounded border" onClick={() => setOpen(false)}>Abbrechen</button>
                <button className="px-3 py-1 rounded bg-primary text-white" onClick={onExport} disabled={loading}>
                  {loading ? 'Erstelle…' : 'Exportieren'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
