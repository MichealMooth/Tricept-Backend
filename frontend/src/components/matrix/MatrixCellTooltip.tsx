export function MatrixCellTooltip(props: {
  skillName: string
  selfRating: number | null
  peerCount: number
  avgPeerRating: number | null
  lastUpdated: string | null
  comments?: string
}) {
  const { skillName, selfRating, peerCount, avgPeerRating, lastUpdated } = props
  return (
    <div className="text-xs">
      <div><strong>{skillName}</strong></div>
      <div>Selbst: {selfRating ?? '—'}/10</div>
      <div>Fremd: {peerCount} (Ø {avgPeerRating ?? '—'})</div>
      <div>Letzte Änderung: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '—'}</div>
    </div>
  )
}
