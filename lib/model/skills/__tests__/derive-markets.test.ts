import { describe, it, expect } from 'vitest'
import { buildScoreMatrix } from '@/lib/model/skills/score-matrix'
import {
  deriveResult1x2,
  deriveOverUnder,
  deriveBtts,
  deriveExactScore,
  deriveCleanSheet,
  deriveTeamTotal,
  deriveWinToNil,
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

// ---------------------------------------------------------------------------
// Fase 16: deriveTeamTotal y deriveWinToNil
// ---------------------------------------------------------------------------

describe('deriveTeamTotal con lambdaHome=1.8, lambdaAway=0.9', () => {
  const matrix = buildScoreMatrix(1.8, 0.9)

  it('identidad 1: home over 0.5 == 1 - cleanSheet.away (P(home scores 0))', () => {
    const homeOver05 = deriveTeamTotal(matrix, 'home', 0.5).over
    const csAway = deriveCleanSheet(matrix).away
    expect(Math.abs(homeOver05 - (1 - csAway))).toBeLessThan(1e-9)
  })

  it('identidad 2: away over 0.5 == 1 - cleanSheet.home (P(away scores 0))', () => {
    const awayOver05 = deriveTeamTotal(matrix, 'away', 0.5).over
    const csHome = deriveCleanSheet(matrix).home
    expect(Math.abs(awayOver05 - (1 - csHome))).toBeLessThan(1e-9)
  })

  it('sanity: over + under == 1.0 para home 0.5', () => {
    const { over, under } = deriveTeamTotal(matrix, 'home', 0.5)
    expect(over + under).toBeCloseTo(1.0, 9)
  })

  it('sanity: over + under == 1.0 para home 1.5', () => {
    const { over, under } = deriveTeamTotal(matrix, 'home', 1.5)
    expect(over + under).toBeCloseTo(1.0, 9)
  })

  it('sanity: over + under == 1.0 para home 2.5', () => {
    const { over, under } = deriveTeamTotal(matrix, 'home', 2.5)
    expect(over + under).toBeCloseTo(1.0, 9)
  })

  it('sanity: over + under == 1.0 para away 0.5', () => {
    const { over, under } = deriveTeamTotal(matrix, 'away', 0.5)
    expect(over + under).toBeCloseTo(1.0, 9)
  })

  it('sanity: over + under == 1.0 para away 1.5', () => {
    const { over, under } = deriveTeamTotal(matrix, 'away', 1.5)
    expect(over + under).toBeCloseTo(1.0, 9)
  })

  it('sanity: over + under == 1.0 para away 2.5', () => {
    const { over, under } = deriveTeamTotal(matrix, 'away', 2.5)
    expect(over + under).toBeCloseTo(1.0, 9)
  })

  it('monotonicidad home: over(0.5) > over(1.5) > over(2.5)', () => {
    const over05 = deriveTeamTotal(matrix, 'home', 0.5).over
    const over15 = deriveTeamTotal(matrix, 'home', 1.5).over
    const over25 = deriveTeamTotal(matrix, 'home', 2.5).over
    expect(over05).toBeGreaterThan(over15)
    expect(over15).toBeGreaterThan(over25)
  })

  it('monotonicidad away: over(0.5) > over(1.5) > over(2.5)', () => {
    const over05 = deriveTeamTotal(matrix, 'away', 0.5).over
    const over15 = deriveTeamTotal(matrix, 'away', 1.5).over
    const over25 = deriveTeamTotal(matrix, 'away', 2.5).over
    expect(over05).toBeGreaterThan(over15)
    expect(over15).toBeGreaterThan(over25)
  })

  it('todos los valores de over y under estan en [0, 1]', () => {
    for (const side of ['home', 'away'] as const) {
      for (const line of [0.5, 1.5, 2.5]) {
        const { over, under } = deriveTeamTotal(matrix, side, line)
        expect(over).toBeGreaterThanOrEqual(0)
        expect(over).toBeLessThanOrEqual(1)
        expect(under).toBeGreaterThanOrEqual(0)
        expect(under).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('deriveWinToNil con lambdaHome=1.8, lambdaAway=0.9', () => {
  const matrix = buildScoreMatrix(1.8, 0.9)

  it('winToNil.home <= cleanSheet.home + epsilon (ganar a cero es subconjunto de clean sheet)', () => {
    const winNil = deriveWinToNil(matrix)
    const cs = deriveCleanSheet(matrix)
    expect(winNil.home).toBeLessThanOrEqual(cs.home + 1e-9)
  })

  it('winToNil.away <= cleanSheet.away + epsilon (ganar a cero es subconjunto de clean sheet)', () => {
    const winNil = deriveWinToNil(matrix)
    const cs = deriveCleanSheet(matrix)
    expect(winNil.away).toBeLessThanOrEqual(cs.away + 1e-9)
  })

  it('home + away no suman 1 (no son exhaustivos)', () => {
    const { home, away } = deriveWinToNil(matrix)
    expect(Math.abs(home + away - 1.0)).toBeGreaterThan(0.01)
  })

  it('home y away estan en [0, 1]', () => {
    const { home, away } = deriveWinToNil(matrix)
    expect(home).toBeGreaterThanOrEqual(0)
    expect(home).toBeLessThanOrEqual(1)
    expect(away).toBeGreaterThanOrEqual(0)
    expect(away).toBeLessThanOrEqual(1)
  })
})

describe('deriveTeamTotal y deriveWinToNil con equipos simetricos (lambda=1.0, 1.0)', () => {
  const matrix = buildScoreMatrix(1.0, 1.0)

  it('simetria: home over 0.5 == away over 0.5', () => {
    const homeOver = deriveTeamTotal(matrix, 'home', 0.5).over
    const awayOver = deriveTeamTotal(matrix, 'away', 0.5).over
    expect(Math.abs(homeOver - awayOver)).toBeLessThan(1e-9)
  })

  it('simetria: deriveWinToNil.home ~= deriveWinToNil.away', () => {
    const { home, away } = deriveWinToNil(matrix)
    expect(Math.abs(home - away)).toBeLessThan(1e-9)
  })
})
