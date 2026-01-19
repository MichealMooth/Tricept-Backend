import { Fragment, useMemo, useState } from 'react'
import type { MatrixData } from '@/services/matrix.service'
import { cellColor } from '@/services/matrix.service'
import { MatrixCellTooltip } from './MatrixCellTooltip'

export function SkillMatrix({ data }: { data: MatrixData }) {
  const [hover, setHover] = useState<{ eId: string; sId: string; x: number; y: number } | null>(null)

  // Group skills by their category for sectioned rendering.
  const skillsByCategory = useMemo(() => {
    const byCategory = new Map<string, { skills: { id: string; name: string }[] }>()
    for (const s of data.skills) {
      const key = s.categoryName ?? 'Ohne Kategorie'
      if (!byCategory.has(key)) byCategory.set(key, { skills: [] })
      byCategory.get(key)!.skills.push({ id: s.id, name: s.name })
    }
    return Array.from(byCategory.entries()).map(([category, val]) => ({ category, skills: val.skills }))
  }, [data.skills])

  const employees = data.employees
  const validSkillIds = useMemo(() => new Set(data.skills.map((s) => s.id)), [data.skills])

  // Fast lookup map for cells: key is "employeeId|skillId".
  const cellMap = useMemo(() => {
    const map = new Map<string, { self: number | null; avg: number | null; cnt: number; last: string | null }>()
    for (const cell of data.data) {
      if (!validSkillIds.has(cell.skillId)) continue
      map.set(`${cell.employeeId}|${cell.skillId}`, {
        self: cell.selfRating,
        avg: cell.avgPeerRating,
        cnt: cell.peerCount,
        last: cell.lastUpdated,
      })
    }
    return map
  }, [data.data, validSkillIds])

  // Map skill id -> name to avoid traversing groups in tooltip.
  const skillNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of data.skills) map.set(s.id, s.name)
    return map
  }, [data.skills])

  return (
    <div className="overflow-x-auto overflow-y-visible border rounded w-full pb-1">
      <table className="text-sm w-max min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white top-0 px-3 py-2 text-left w-72">Skill</th>
            {employees.map((e) => (
              <th key={e.id} className="top-0 bg-white px-2 py-1 text-xs text-left min-w-[10rem] max-w-[14rem] whitespace-normal break-words">
                {e.lastName}, {e.firstName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skillsByCategory.map((g) => (
            <Fragment key={`group-${g.category}`}>
              <tr key={`cat-${g.category}`}>
                <td className="bg-gray-50 font-semibold px-3 py-2 sticky left-0 z-10" colSpan={1 + employees.length}>
                  {g.category}
                </td>
              </tr>
              {g.skills.map((s) => (
                <tr key={s.id}>
                  <td className="sticky left-0 bg-white px-3 py-2 whitespace-normal break-words w-72 max-w-[18rem] border-r">{s.name}</td>
                  {employees.map((e) => {
                    const c = cellMap.get(`${e.id}|${s.id}`)
                    const bg = cellColor(c?.self ?? null)
                    return (
                      <td
                        key={`${e.id}|${s.id}`}
                        className="h-[56px] relative border-b border-r"
                        style={{ backgroundColor: bg }}
                        onMouseEnter={(ev) => setHover({ eId: e.id, sId: s.id, x: (ev as any).clientX, y: (ev as any).clientY })}
                        onMouseMove={(ev) => setHover((prev) => (prev ? { ...prev, x: (ev as any).clientX, y: (ev as any).clientY } : prev))}
                        onMouseLeave={() => setHover(null)}
                      >
                        <div className="flex items-end justify-between px-2 py-1 h-full">
                          <div className="text-lg font-semibold">{c?.self ?? '—'}</div>
                          <div className="text-[11px]">Ø {c?.avg ?? '—'}</div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      {hover && (() => {
        const key = `${hover.eId}|${hover.sId}`
        const c = cellMap.get(key)
        const skillName = skillNameById.get(hover.sId) ?? ''
        return (
          <div
            style={{ position: 'fixed', left: hover.x + 12, top: hover.y + 12, zIndex: 1000 }}
            className="bg-white shadow-lg rounded p-2 w-56 border"
          >
            <MatrixCellTooltip
              skillName={skillName}
              selfRating={c?.self ?? null}
              peerCount={c?.cnt ?? 0}
              avgPeerRating={c?.avg ?? null}
              lastUpdated={c?.last ?? null}
            />
          </div>
        )
      })()}
    </div>
  )
}
