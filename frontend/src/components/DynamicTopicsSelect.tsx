import React from 'react'
import { topicsOptions, type Topic } from '@/constants/enums'

export type DynamicTopicsSelectProps = {
  value: Topic[]
  onChange: (next: Topic[]) => void
  label?: string
  minItems?: number
  maxItems?: number
  placeholder?: string
  announceAddRemove?: boolean
}

/**
 * DynamicTopicsSelect
 * - Renders 1..N select rows for Themenbereiche with deduplication across rows
 * - Guarantees min/max rows (default: 1..6)
 * - Calls onChange with the topics array on every user change
 */
export function DynamicTopicsSelect({
  value,
  onChange,
  label = 'Themenbereiche',
  minItems = 1,
  maxItems = 6,
  placeholder = 'Themenbereich wählen',
  announceAddRemove = true,
}: DynamicTopicsSelectProps) {
  const selections = React.useMemo(() => value ?? [], [value])
  const [liveMessage, setLiveMessage] = React.useState<string>('')

  const ensureMin = React.useCallback(
    (arr: Topic[]): Topic[] => {
      if (!arr || arr.length === 0) return Array.from({ length: Math.max(1, minItems) }, () => '' as Topic)
      if (arr.length < minItems) return [...arr, ...Array.from({ length: minItems - arr.length }, () => '' as Topic)]
      return arr
    },
    [minItems]
  )

  const current = ensureMin(selections).slice(0, Math.max(minItems, Math.min(maxItems, selections.length || minItems)))

  const availableForIndex = (idx: number) => {
    const chosen = new Set(current.filter((_, i) => i !== idx && current[i]))
    return topicsOptions.filter((o) => !chosen.has(o.value))
  }

  const addRow = () => {
    if (current.length >= maxItems) return
    const next = [...current, '' as Topic]
    if (announceAddRemove) setLiveMessage('Themenbereich hinzugefügt')
    onChange(next)
  }

  const removeRow = (index: number) => {
    if (current.length <= minItems) return
    const next = current.filter((_, i) => i !== index)
    if (announceAddRemove) setLiveMessage('Themenbereich entfernt')
    onChange(next)
  }

  const changeAt = (index: number, val: string) => {
    const next = [...current]
    next[index] = (val as Topic) || ('' as Topic)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="font-medium text-sm text-foreground">{label}</label>
      <div className="flex flex-col gap-2">
        {current.map((v, idx) => {
          const options = availableForIndex(idx)
          return (
            <div key={idx} className="flex items-center gap-2">
              <select
                aria-label={`${label} ${idx + 1}`}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={v || ''}
                onChange={(e) => changeAt(idx, e.target.value)}
              >
                <option value="" disabled>
                  {placeholder}
                </option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {current.length > minItems && (
                <button
                  type="button"
                  aria-label="Themenbereich entfernen"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-destructive/10 px-2 py-2 text-destructive hover:bg-destructive/20"
                  onClick={() => removeRow(idx)}
                >
                  {/* simple X icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <small className="text-muted-foreground">Mindestens {minItems}, maximal {maxItems} Themenbereiche.</small>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          onClick={addRow}
          disabled={current.length >= maxItems}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          + Themenbereich hinzufügen
        </button>
      </div>

      {announceAddRemove && (
        <div aria-live="polite" className="sr-only">
          {liveMessage}
        </div>
      )}
    </div>
  )
}

export default DynamicTopicsSelect
