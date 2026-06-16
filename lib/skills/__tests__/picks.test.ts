import { describe, it, expect } from 'vitest'
import { deriveOutcome, resolveVerdict } from '@/lib/skills/picks'

describe('deriveOutcome', () => {
  it('returns home on home win', () => expect(deriveOutcome(2, 0)).toBe('home'))
  it('returns away on away win', () => expect(deriveOutcome(0, 1)).toBe('away'))
  it('returns draw on draw', () => expect(deriveOutcome(1, 1)).toBe('draw'))
  it('returns draw on 0-0', () => expect(deriveOutcome(0, 0)).toBe('draw'))
  it('returns home on high-scoring home win', () => expect(deriveOutcome(5, 3)).toBe('home'))
})

describe('resolveVerdict', () => {
  it('correct when pick matches actual', () => {
    expect(resolveVerdict('home', 2, 0)).toBe('correct')
    expect(resolveVerdict('away', 0, 3)).toBe('correct')
    expect(resolveVerdict('draw', 1, 1)).toBe('correct')
  })

  it('incorrect when pick does not match actual', () => {
    expect(resolveVerdict('draw', 2, 0)).toBe('incorrect')
    expect(resolveVerdict('home', 0, 1)).toBe('incorrect')
    expect(resolveVerdict('away', 1, 1)).toBe('incorrect')
  })

  it('incorrect when picking home but away wins', () => {
    expect(resolveVerdict('home', 0, 2)).toBe('incorrect')
  })
})
