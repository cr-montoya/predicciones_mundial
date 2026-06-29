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
// Test: corners null -> historical prior (WC_AVG_CORNERS_PER_MATCH)
// ---------------------------------------------------------------------------

describe('buildCornersOutput - null handling', () => {
  it('with corners: null on both teams, returns a valid output (does not throw)', () => {
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

  it('with corners: null, model uses historical prior (WC_AVG_CORNERS), does not treat as 0', () => {
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

    // When there is no data, falls back to prior: cornersLine = CORNERS_FALLBACK_LINE
    // The market line must be the fallback (10.5), not 0
    const keys = Object.keys(output.probabilities)
    const hasZeroLine = keys.some(k => k.includes('_0'))
    expect(hasZeroLine).toBe(false)

    // The line must be CORNERS_FALLBACK_LINE
    const hasCorrectLine = keys.some(k => k.includes(String(CORNERS_FALLBACK_LINE)))
    expect(hasCorrectLine).toBe(true)
  })

  it('with corners: null, sanityCheck passes (probabilities sum to 1.0±0.001)', () => {
    const output = buildCornersOutput(fixture, [], 1001, 1002)
    expect(() => sanityCheck(output)).not.toThrow()
  })

  it('with corners: null, confidence is low (no historical data)', () => {
    const output = buildCornersOutput(fixture, [], 1001, 1002)
    expect(output.confidence).toBe('low')
  })

  it('with no matchStats at all (empty array), uses historical prior', () => {
    const output = buildCornersOutput(fixture, [], 1001, 1002)

    // With no data at all, must fall back to the prior
    expect(output.market).toBe('corners')
    expect(output.confidence).toBe('low')
    expect(() => sanityCheck(output)).not.toThrow()

    const keys = Object.keys(output.probabilities)
    expect(keys.some(k => k.includes(String(CORNERS_FALLBACK_LINE)))).toBe(true)
  })

  it('with real corners data (not null), uses that data and confidence is medium or high', () => {
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
    // With real data, confidence should not be low
    expect(['medium', 'high']).toContain(output.confidence)
  })
})

// ---------------------------------------------------------------------------
// Test: cards null -> historical prior (WC_AVG_YELLOW_PER_MATCH)
// ---------------------------------------------------------------------------

describe('buildCardsOutputs - null handling', () => {
  it('with yellowCards: null and redCards: null, returns valid outputs (does not throw)', () => {
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

  it('with yellowCards: null, sanityCheck passes on all outputs', () => {
    const outputs = buildCardsOutputs(fixture, [], 1001, 1002)
    for (const o of outputs) {
      expect(() => sanityCheck(o)).not.toThrow()
    }
  })

  it('with yellowCards: null, confidence is low', () => {
    const outputs = buildCardsOutputs(fixture, [], 1001, 1002)
    for (const o of outputs) {
      expect(o.confidence).toBe('low')
    }
  })

  it('with yellowCards: null, total_cards market uses prior and is not degenerate (probs are not exactly 0 or 1)', () => {
    const outputs = buildCardsOutputs(fixture, [], 1001, 1002)
    for (const o of outputs) {
      for (const [, p] of Object.entries(o.probabilities)) {
        expect(p).toBeGreaterThan(0)
        expect(p).toBeLessThan(1)
      }
    }
  })

  it('with partially null stats (only one team has data), model does not throw', () => {
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
      // team 1002 has no data (simulates football-data not providing stats for the away team)
    ]

    expect(() => buildCornersOutput(fixture, statsPartial, 1001, 1002)).not.toThrow()
    expect(() => buildCardsOutputs(fixture, statsPartial, 1001, 1002)).not.toThrow()

    const cornersOut = buildCornersOutput(fixture, statsPartial, 1001, 1002)
    expect(() => sanityCheck(cornersOut)).not.toThrow()
  })
})
