import { describe, it, expect } from 'vitest'
import { buildScoreMatrix } from '@/lib/model/skills/score-matrix'
import {
  deriveResult1x2,
  deriveOverUnder,
  deriveBtts,
  deriveExactScore,
} from '@/lib/model/skills/derive-markets'

const TOLERANCE = 0.001

describe('deriveResult1x2 con equipos iguales (1.35, 1.35)', () => {
  const matrix = buildScoreMatrix(1.35, 1.35)

  it('home + draw + away == 1.0 (+-0.001)', () => {
    const { home, draw, away } = deriveResult1x2(matrix)
    const sum = home + draw + away
    expect(sum).toBeGreaterThanOrEqual(1.0 - TOLERANCE)
    expect(sum).toBeLessThanOrEqual(1.0 + TOLERANCE)
  })

  it('home ~= away para equipos iguales (diferencia < 0.01)', () => {
    const { home, away } = deriveResult1x2(matrix)
    expect(Math.abs(home - away)).toBeLessThan(0.01)
  })

  it('todos los valores son >= 0 y <= 1', () => {
    const { home, draw, away } = deriveResult1x2(matrix)
    expect(home).toBeGreaterThanOrEqual(0)
    expect(draw).toBeGreaterThanOrEqual(0)
    expect(away).toBeGreaterThanOrEqual(0)
    expect(home).toBeLessThanOrEqual(1)
    expect(draw).toBeLessThanOrEqual(1)
    expect(away).toBeLessThanOrEqual(1)
  })
})

describe('deriveResult1x2 con local muy fuerte (3.0, 0.5)', () => {
  const matrix = buildScoreMatrix(3.0, 0.5)

  it('home es el outcome mas probable y > 0.5', () => {
    const { home, draw, away } = deriveResult1x2(matrix)
    expect(home).toBeGreaterThan(0.5)
    expect(home).toBeGreaterThan(draw)
    expect(home).toBeGreaterThan(away)
  })
})

describe('deriveOverUnder con equipos iguales (1.35, 1.35)', () => {
  const matrix = buildScoreMatrix(1.35, 1.35)

  it('over + under == 1.0 (+-0.001) para linea 2.5', () => {
    const { over, under } = deriveOverUnder(matrix, 2.5)
    const sum = over + under
    expect(sum).toBeGreaterThanOrEqual(1.0 - TOLERANCE)
    expect(sum).toBeLessThanOrEqual(1.0 + TOLERANCE)
  })

  it('over + under == 1.0 (+-0.001) para linea 1.5', () => {
    const { over, under } = deriveOverUnder(matrix, 1.5)
    const sum = over + under
    expect(sum).toBeGreaterThanOrEqual(1.0 - TOLERANCE)
    expect(sum).toBeLessThanOrEqual(1.0 + TOLERANCE)
  })

  it('over + under == 1.0 (+-0.001) para linea 3.5', () => {
    const { over, under } = deriveOverUnder(matrix, 3.5)
    const sum = over + under
    expect(sum).toBeGreaterThanOrEqual(1.0 - TOLERANCE)
    expect(sum).toBeLessThanOrEqual(1.0 + TOLERANCE)
  })
})

describe('deriveBtts con equipos iguales (1.35, 1.35)', () => {
  const matrix = buildScoreMatrix(1.35, 1.35)

  it('yes + no == 1.0 (+-0.001)', () => {
    const { yes, no } = deriveBtts(matrix)
    const sum = yes + no
    expect(sum).toBeGreaterThanOrEqual(1.0 - TOLERANCE)
    expect(sum).toBeLessThanOrEqual(1.0 + TOLERANCE)
  })

  it('yes y no son >= 0 y <= 1', () => {
    const { yes, no } = deriveBtts(matrix)
    expect(yes).toBeGreaterThanOrEqual(0)
    expect(no).toBeGreaterThanOrEqual(0)
    expect(yes).toBeLessThanOrEqual(1)
    expect(no).toBeLessThanOrEqual(1)
  })
})

describe('deriveExactScore con equipos iguales (1.35, 1.35)', () => {
  const matrix = buildScoreMatrix(1.35, 1.35)

  it('top 5 probabilidades + other suman 1.0 (+-0.001)', () => {
    const result = deriveExactScore(matrix, 5)
    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(sum).toBeGreaterThanOrEqual(1.0 - TOLERANCE)
    expect(sum).toBeLessThanOrEqual(1.0 + TOLERANCE)
  })

  it('el resultado tiene exactamente 6 claves (5 top + other)', () => {
    const result = deriveExactScore(matrix, 5)
    expect(Object.keys(result).length).toBe(6)
    expect('other' in result).toBe(true)
  })

  it('todas las probabilidades son >= 0 y <= 1', () => {
    const result = deriveExactScore(matrix, 5)
    for (const [, prob] of Object.entries(result)) {
      expect(prob).toBeGreaterThanOrEqual(0)
      expect(prob).toBeLessThanOrEqual(1)
    }
  })

  it('other es >= 0 (la masa restante no puede ser negativa)', () => {
    const result = deriveExactScore(matrix, 5)
    expect(result['other']).toBeGreaterThanOrEqual(0)
  })
})
