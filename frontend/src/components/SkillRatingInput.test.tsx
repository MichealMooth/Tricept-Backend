import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SkillRatingInput } from './SkillRatingInput'

describe('SkillRatingInput', () => {
  it('rendert korrekt mit Wert 5', () => {
    render(<SkillRatingInput value={5} onChange={() => {}} showScale />)
    expect(screen.getByText('5/10')).toBeInTheDocument()
  })

  it('ruft onChange beim Slider-Change auf', () => {
    const onChange = vi.fn()
    render(<SkillRatingInput value={5} onChange={onChange} />)
    const input = screen.getByRole('slider') as HTMLInputElement
    fireEvent.change(input, { target: { value: '7' } })
    // Commit happens on mouseup/touchend per component
    fireEvent.mouseUp(input)
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('zeigt rote Farbe bei Wert 2', () => {
    render(<SkillRatingInput value={2} onChange={() => {}} />)
    const input = screen.getByRole('slider') as HTMLInputElement
    // The component sets style accentColor to #ff6b6b for <=2
    expect(input.getAttribute('style') || '').toMatch('#ff6b6b')
  })

  it("zeigt Label 'Kompetent' bei Wert 6", () => {
    render(<SkillRatingInput value={6} onChange={() => {}} showScale />)
    expect(screen.getByText('Kompetent')).toBeInTheDocument()
  })
})
