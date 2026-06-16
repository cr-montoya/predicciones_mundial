import { describe, it, expect } from 'vitest'
import { calcValue, VALUE_THRESHOLD } from '@/lib/model/skills/value-calc'

const TOLERANCE = 0.0001

describe('calcValue', () => {
  it('modelo 0.62 vs mercado 0.526 => diff ~+0.094 => VALOR+', () => {
    const result = calcValue({ modelProbability: 0.62, marketProbability: 0.526 })
    expect(Math.abs(result.diff - 0.094)).toBeLessThan(TOLERANCE)
    expect(result.label).toBe('VALOR+')
  })

  it('modelo 0.40 vs mercado 0.526 => diff ~-0.126 => VALOR-', () => {
    const result = calcValue({ modelProbability: 0.40, marketProbability: 0.526 })
    expect(Math.abs(result.diff - (-0.126))).toBeLessThan(TOLERANCE)
    expect(result.label).toBe('VALOR-')
  })

  it('modelo 0.56 vs mercado 0.526 => diff ~+0.034 => NEUTRO', () => {
    const result = calcValue({ modelProbability: 0.56, marketProbability: 0.526 })
    expect(Math.abs(result.diff - 0.034)).toBeLessThan(TOLERANCE)
    expect(result.label).toBe('NEUTRO')
  })

  it('diff exacto 0.08 => VALOR+ (limite inclusivo)', () => {
    const result = calcValue({ modelProbability: VALUE_THRESHOLD, marketProbability: 0 })
    expect(result.diff).toBe(VALUE_THRESHOLD)
    expect(result.label).toBe('VALOR+')
  })

  it('diff exacto -0.08 => VALOR- (limite inclusivo)', () => {
    const result = calcValue({ modelProbability: 0, marketProbability: VALUE_THRESHOLD })
    expect(result.diff).toBe(-VALUE_THRESHOLD)
    expect(result.label).toBe('VALOR-')
  })

  it('diff = 0 => NEUTRO', () => {
    const result = calcValue({ modelProbability: 0.50, marketProbability: 0.50 })
    expect(result.diff).toBe(0)
    expect(result.label).toBe('NEUTRO')
  })

  it('diff queda en rango [-1, 1]', () => {
    const cases = [
      { modelProbability: 0, marketProbability: 1 },
      { modelProbability: 1, marketProbability: 0 },
      { modelProbability: 0.5, marketProbability: 0.5 },
    ]
    for (const input of cases) {
      const { diff } = calcValue(input)
      expect(diff).toBeGreaterThanOrEqual(-1)
      expect(diff).toBeLessThanOrEqual(1)
    }
  })

  it('VALUE_THRESHOLD exportado es 0.08', () => {
    expect(VALUE_THRESHOLD).toBe(0.08)
  })
})
