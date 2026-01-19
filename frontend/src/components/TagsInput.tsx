import React from 'react'

export default function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const addTag = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    if (value.includes(t)) { setInput(''); return }
    onChange([...value, t])
    setInput('')
  }

  const addMany = (parts: string[]) => {
    let next = [...value]
    for (const p of parts) {
      const t = p.trim()
      if (!t) continue
      if (!next.includes(t)) next.push(t)
    }
    onChange(next)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.includes(',')) {
        const parts = input.split(',')
        addMany(parts.slice(0, -1))
        setInput(parts.at(-1) ?? '')
      } else {
        addTag(input)
      }
    }
    // Backspace on empty input removes last tag
    if (e.key === 'Backspace' && input.length === 0 && value.length > 0) {
      e.preventDefault()
      const next = value.slice(0, -1)
      onChange(next)
    }
  }

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v.includes(',')) {
      const parts = v.split(',')
      addMany(parts.slice(0, -1))
      setInput(parts.at(-1) ?? '')
    } else {
      setInput(v)
    }
  }

  const onBlur = () => {
    // Add remaining input on blur
    addTag(input)
  }

  const removeAt = (i: number) => {
    const next = value.slice()
    next.splice(i, 1)
    onChange(next)
    // keep focus on input
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-input px-2 py-2">
      {value.map((t, i) => (
        <span key={t + i} className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 ring-1 ring-gray-200 px-3 py-1.5 text-sm">
          {t}
          <button type="button" aria-label={`remove ${t}`} className="text-gray-500 hover:text-gray-700" onClick={() => removeAt(i)}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={onChangeInput}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 min-w-[140px] px-2 py-1.5 outline-none text-sm"
      />
    </div>
  )
}
