import { useEffect, useMemo, useState } from 'react'

export function SkillRatingInput(props: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  showScale?: boolean
}) {
  const { value, onChange, disabled, showScale } = props
  const [internal, setInternal] = useState<number>(value)

  useEffect(() => setInternal(value), [value])

  const color = useMemo(() => {
    if (internal <= 2) return '#ff6b6b'
    if (internal <= 4) return '#ffa500'
    if (internal <= 6) return '#ffd700'
    if (internal <= 8) return '#90ee90'
    return '#17f0f0'
  }, [internal])

  const label = useMemo(() => {
    if (internal <= 2) return 'Beginner'
    if (internal <= 4) return 'Fortgeschritten'
    if (internal <= 6) return 'Kompetent'
    if (internal <= 8) return 'Erfahren'
    return 'Experte'
  }, [internal])

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={internal}
          disabled={disabled}
          onChange={(e) => setInternal(Number(e.target.value))}
          onMouseUp={() => onChange(internal)}
          onTouchEnd={() => onChange(internal)}
          style={{ accentColor: color }}
        />
        <div className="min-w-[56px] text-sm font-semibold" style={{ color }}>
          {internal}/10
        </div>
      </div>
      {showScale && (
        <div className="mt-1 text-xs text-gray-600">{label}</div>
      )}
    </div>
  )
}
