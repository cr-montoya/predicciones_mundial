/**
 * Tests for null handling in match stats.
 * Verifies that buildCornersOutput and buildCardsOutputs use the historical
 * prior when corners/cards are null, without failing or treating them as 0.
 */

import { describe, it, expect } from 'vitest'
import { buildCornersOutput, buildCardsOutputs } from '@/lib/model/cards-corners'
import { sanityCheck } from '@/lib/types'
import type { Fixture, MatchStats } from '@/lib/types'
import { WC_AVG_CORNERS_PER_MATCH, CORNERS_FALLBACK_LINE } from '@/lib/model/constants'

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const fixture: Fixture = {
  id: 9001,
  homeTeamId: 1001,
  awayTeamId: 1002,
  kickoffUtc: '2026-06-15T18:00:00Z',
  status: 'scheduled',
  homeGoals: null,
  awayGoals: null,
  round: 'group',
}

// ---------------------------------------------------------------------------
// Test: corners null -> prior histórico (WC_AVG_CORNERS_PER_MATCH)
// ---------------------------------------------------------------------------

describe('buildCornersOutput - tratamiento de null', () => {
  it('con corners: null en ambos equipos, devuelve output válido (no explota)', () => {
    const statsWithNullCorners: MatchStats[] = [
      {
        fixtureId: 9001,
        teamId: 1001,
        corners: null,
        yellowCards: null,
        redCards: null,
        shotsOnTarget: null,
        possession: null,
      },
      {
        fixtureId: 9001,
        teamId: 1002,
        corners: null,
        yellowCards: null,
        redCards: null,
        shotsOnTarget: null,
        possession: null,
      },
    ]

    expect(() => buildCornersOutput(fixture, statsWithNullCorners, 1001, 1002)).not.toThrow()
  })

  it('con corners: null, el modelo usa prior histórico (WC_AVG_CORNERS), no trata como 0', () => {
    const statsNull: MatchStats[] = [
      {
        fixtureId: 9001,
        teamId: 1001,
        corners: null,
        yellowCards: null,
        redCards: null,
        shotsOnTarget: null,
        possession: null,
      },
    ]

    const output = buildCornersOutput(fixture, statsNull, 1001, 1002)

    // Cuando no hay datos, cae al prior: cornersLine = CORNERS_FALLBACK_LINE
    // La línea en el mercado debe ser la de fallback (10.5), no 0
    const keys = Object.keys(output.probabilities)
    const hasZeroLine = keys.some(k => k.includes('_0'))
    expect(hasZeroLine).toBe(false)

    // La línea debe ser CORNERS_FALLBACK_LINE
    const hasCorrectLine = keys.some(k => k.includes(String(CORNERS_FALLBACK_LINE)))
    expect(hasCorrectLine).toBe(true)
  })

  it('con corners: null, sanityCheck pasa (probabilidades suman 1.0±0.001)', () => {
    const output = buildCornersOutput(fixture, [], 1001, 1002)
    expect(() => sanityCheck(output)).not.toThrow()
  })

  it('con corners: null, confidence es low (no hay historial)', () => {
    const output = buildCornersOutput(fixture, [], 1001, 1002)
    expect(output.confidence).toBe('low')
  })

  it('sin matchStats del todo (array vacío), usa prior histórico', () => {
    const output = buildCornersOutput(fixture, [], 1001, 1002)

    // Con cero datos debe caer al prior
    expect(output.market).toBe('corners')
    expect(output.confidence).toBe('low')
    expect(() => sanityCheck(output)).not.toThrow()

    const keys = Object.keys(output.probabilities)
    expect(keys.some(k => k.includes(String(CORNERS_FALLBACK_LINE)))).toBe(true)
  })

  it('con corners con datos reales (no null), usa esos datos y confidence es medium o high', () => {
    const statsReal: MatchStats[] = [
      {
        fixtureId: 9001,
        teamId: 1001,
        corners: 6,
        yellowCards: 2,
        redCards: 0,
        shotsOnTarget: 4,
        possession: 50,
      },
      {
        fixtureId: 9001,
        teamId: 1002,
        corners: 5,
        yellowCards: 1,
        redCards: 0,
        shotsOnTarget: 3,
        possession: 50,
      },
    ]

    const output = buildCornersOutput(fixture, statsReal, 1001, 1002)
    expect(() => sanityCheck(output)).not.toThrow()
    // Con datos el confidence no debería ser low
    expect(['medium', 'high']).toContain(output.confidence)
  })
})

// ---------------------------------------------------------------------------
// Test: cards null -> prior histórico (WC_AVG_YELLOW_PER_MATCH)
// ---------------------------------------------------------------------------

describe('buildCardsOutputs - tratamiento de null', () => {
  it('con yellowCards: null y redCards: null, devuelve outputs válidos (no explota)', () => {
    const statsNull: MatchStats[] = [
      {
        fixtureId: 9001,
        teamId: 1001,
        corners: null,
        yellowCards: null,
        redCards: null,
        shotsOnTarget: null,
        possession: null,
      },
    ]

    expect(() => buildCardsOutputs(fixture, statsNull, 1001, 1002)).not.toThrow()
  })

  it('con yellowCards: null, sanityCheck pasa en todos los outputs', () => {
    const outputs = buildCardsOutputs(fixture, [], 1001, 1002)
    for (const o of outputs) {
      expect(() => sanityCheck(o)).not.toThrow()
    }
  })

  it('con yellowCards: null, confidence es low', () => {
    const outputs = buildCardsOutputs(fixture, [], 1001, 1002)
    for (const o of outputs) {
      expect(o.confidence).toBe('low')
    }
  })

  it('con yellowCards: null, el mercado total_cards usa prior y no está degenerado (probs no son 0 o 1 exacto)', () => {
    const outputs = buildCardsOutputs(fixture, [], 1001, 1002)
    for (const o of outputs) {
      for (const [, p] of Object.entries(o.probabilities)) {
        expect(p).toBeGreaterThan(0)
        expect(p).toBeLessThan(1)
      }
    }
  })

  it('stats parcialmente nulas (solo un equipo tiene datos), el modelo no explota', () => {
    const statsPartial: MatchStats[] = [
      {
        fixtureId: 9001,
        teamId: 1001,
        corners: 7,
        yellowCards: 2,
        redCards: 0,
        shotsOnTarget: 5,
        possession: 55,
      },
      // equipo 1002 sin datos (simula football-data que no provee stats para el away)
    ]

    expect(() => buildCornersOutput(fixture, statsPartial, 1001, 1002)).not.toThrow()
    expect(() => buildCardsOutputs(fixture, statsPartial, 1001, 1002)).not.toThrow()

    const cornersOut = buildCornersOutput(fixture, statsPartial, 1001, 1002)
    expect(() => sanityCheck(cornersOut)).not.toThrow()
  })
})
