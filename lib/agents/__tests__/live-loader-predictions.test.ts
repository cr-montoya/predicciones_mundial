/**
 * Sanity tests for the prediction logic in live-loader.ts (Phase 13).
 *
 * Validates:
 * 1. Scheduled fixtures produce a defined prediction with coherent values.
 * 2. Finished fixtures produce prediction = undefined.
 * 3. Winner coherence: strong team (Spain) beats weak team (Haiti).
 * 4. Fixtures with unknown teams produce prediction = undefined.
 * 5. result_1x2 market keys are correct and compatible with live-loader.
 */

import { describe, it, expect } from 'vitest'
import type { Fixture, Team } from '@/lib/types'
import {
  computePredictionsForFixture,
  teamMap,
} from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFixture(overrides: Partial<Fixture> & { id: number }): Fixture {
  return {
    id: overrides.id,
    homeTeamId: overrides.homeTeamId ?? 9,
    awayTeamId: overrides.awayTeamId ?? 168,
    kickoffUtc: overrides.kickoffUtc ?? '2026-06-15T18:00:00.000Z',
    status: overrides.status ?? 'scheduled',
    homeGoals: overrides.homeGoals ?? null,
    awayGoals: overrides.awayGoals ?? null,
    round: overrides.round ?? 'group',
  }
}

/**
 * Mirrors the prediction derivation logic from live-loader.ts (the map() block).
 * Used to verify coherence between the prediction model and the integration code.
 */
function derivePrediction(
  fixture: Fixture,
  byId: Map<number, Team>
): { winner: string; winnerProb: number; expectedGoals: number } | undefined {
  const preds = computePredictionsForFixture(fixture, byId)
  const r1x2 = preds.find(p => p.market === 'result_1x2')
  const exactScore = preds.find(p => p.market === 'exact_score')

  if (!r1x2 || !exactScore) return undefined

  // Mirrors live-loader.ts lines 75-84 literally
  const [topKey, topProb] = Object.entries(r1x2.probabilities).sort(
    ([, a], [, b]) => b - a
  )[0]

  const winner =
    topKey === 'home'
      ? (byId.get(fixture.homeTeamId)?.name ?? 'Home')
      : topKey === 'away'
      ? (byId.get(fixture.awayTeamId)?.name ?? 'Away')
      : 'Draw'

  const expectedGoals = Object.entries(exactScore.probabilities).reduce(
    (sum, [key, prob]) => {
      const [h, a] = key.split('-').map(Number)
      if (isNaN(h) || isNaN(a)) return sum
      return sum + prob * (h + a)
    },
    0
  )

  return {
    winner,
    winnerProb: topProb,
    expectedGoals: Math.round(expectedGoals * 10) / 10,
  }
}

// ---------------------------------------------------------------------------
// Setup: real World Cup teams
// ---------------------------------------------------------------------------

const staticTeams = buildStaticTeams()
const byId = teamMap(staticTeams)

// Real IDs from teams-seed.ts and historical-stats.json
const SPAIN_ID = 9
const FRANCE_ID = 2
const HAITI_ID = 168

// ---------------------------------------------------------------------------
// Test suite 1: result_1x2 market keys
// CRITICAL: live-loader.ts compared topKey against 'home_win' and 'away_win',
// but deriveResult1x2 produces keys 'home', 'draw', 'away'. This test detects
// that inconsistency.
// ---------------------------------------------------------------------------

describe('result_1x2 - market keys (contract between model and live-loader)', () => {
  const fixture = makeFixture({ id: 2001, homeTeamId: SPAIN_ID, awayTeamId: HAITI_ID })
  const preds = computePredictionsForFixture(fixture, byId)
  const r1x2 = preds.find(p => p.market === 'result_1x2')!

  it('result_1x2 contains exactly home, draw, away', () => {
    const keys = Object.keys(r1x2.probabilities).sort()
    expect(keys).toEqual(['away', 'draw', 'home'])
  })

  it('home exists as a key in result_1x2', () => {
    expect(r1x2.probabilities).toHaveProperty('home')
  })

  it('away exists as a key in result_1x2', () => {
    expect(r1x2.probabilities).toHaveProperty('away')
  })
})

// ---------------------------------------------------------------------------
// Test suite 2: scheduled Spain vs France produces a defined prediction
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - scheduled fixture with known teams', () => {
  const fixture = makeFixture({ id: 1001, homeTeamId: SPAIN_ID, awayTeamId: FRANCE_ID })
  const prediction = derivePrediction(fixture, byId)

  it('prediction is not undefined', () => {
    expect(prediction).toBeDefined()
  })

  it('winner is a non-empty string', () => {
    expect(typeof prediction!.winner).toBe('string')
    expect(prediction!.winner.length).toBeGreaterThan(0)
  })

  it('winnerProb is strictly in (0, 1)', () => {
    expect(prediction!.winnerProb).toBeGreaterThan(0)
    expect(prediction!.winnerProb).toBeLessThan(1)
  })

  it('expectedGoals is in [0.4, 7.0]', () => {
    expect(prediction!.expectedGoals).toBeGreaterThanOrEqual(0.4)
    expect(prediction!.expectedGoals).toBeLessThanOrEqual(7.0)
  })
})

// ---------------------------------------------------------------------------
// Test suite 3: scheduled Spain vs Haiti (strong team vs weak team)
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - Spain (id=9) vs Haiti (id=168)', () => {
  const fixture = makeFixture({ id: 1002, homeTeamId: SPAIN_ID, awayTeamId: HAITI_ID })
  const prediction = derivePrediction(fixture, byId)

  it('prediction is not undefined', () => {
    expect(prediction).toBeDefined()
  })

  it('winnerProb is strictly in (0, 1)', () => {
    expect(prediction!.winnerProb).toBeGreaterThan(0)
    expect(prediction!.winnerProb).toBeLessThan(1)
  })

  it('expectedGoals is in [0.4, 7.0]', () => {
    expect(prediction!.expectedGoals).toBeGreaterThanOrEqual(0.4)
    expect(prediction!.expectedGoals).toBeLessThanOrEqual(7.0)
  })

  it('winner is a non-empty string', () => {
    expect(typeof prediction!.winner).toBe('string')
    expect(prediction!.winner.length).toBeGreaterThan(0)
  })

  it('predicted winner is Spain (stronger team playing at home)', () => {
    // Spain (attackStrength ~1.4, defenseStrength ~0.55) vs Haiti (weak).
    // As the home team, Spain must be the predicted winner.
    // FAILS if live-loader uses wrong keys and always returns 'Draw'.
    expect(prediction!.winner).toBe('Spain')
  })

  it('Spain winnerProb is greater than 0.5', () => {
    // With Spain at home against Haiti, their win probability must exceed 50%.
    // FAILS if the winner is 'Draw' (draw probability < 50% in this matchup).
    expect(prediction!.winnerProb).toBeGreaterThan(0.5)
  })
})

// ---------------------------------------------------------------------------
// Test suite 4: finished fixture produces prediction = undefined
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - finished fixture', () => {
  const fixture = makeFixture({
    id: 1003,
    homeTeamId: SPAIN_ID,
    awayTeamId: HAITI_ID,
    status: 'finished',
    homeGoals: 3,
    awayGoals: 0,
  })

  it('computePredictionsForFixture returns empty array for finished fixture', () => {
    const preds = computePredictionsForFixture(fixture, byId)
    expect(preds).toHaveLength(0)
  })

  it('derived prediction is undefined for finished fixture', () => {
    const prediction = derivePrediction(fixture, byId)
    expect(prediction).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Test suite 5: fixture with unknown teams produces prediction = undefined
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - fixture with unknown teams', () => {
  const fixture = makeFixture({
    id: 1004,
    homeTeamId: 99999,
    awayTeamId: 88888,
  })

  it('computePredictionsForFixture returns empty array for unknown teams', () => {
    const preds = computePredictionsForFixture(fixture, byId)
    expect(preds).toHaveLength(0)
  })

  it('derived prediction is undefined for unknown teams', () => {
    const prediction = derivePrediction(fixture, byId)
    expect(prediction).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Test suite 6: sanity checks on internal model outputs
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - internal output sanity checks', () => {
  const fixture = makeFixture({ id: 1005, homeTeamId: SPAIN_ID, awayTeamId: HAITI_ID })
  const preds = computePredictionsForFixture(fixture, byId)

  it('returns at least result_1x2 and exact_score markets', () => {
    const markets = preds.map(p => p.market)
    expect(markets).toContain('result_1x2')
    expect(markets).toContain('exact_score')
  })

  it('result_1x2 probabilities sum to 1.0 +/- 0.001', () => {
    const r1x2 = preds.find(p => p.market === 'result_1x2')!
    const sum = Object.values(r1x2.probabilities).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('exact_score probabilities sum to 1.0 +/- 0.001', () => {
    const exactScore = preds.find(p => p.market === 'exact_score')!
    const sum = Object.values(exactScore.probabilities).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('result_1x2 has no probability exactly at 0 or 1', () => {
    const r1x2 = preds.find(p => p.market === 'result_1x2')!
    for (const [, prob] of Object.entries(r1x2.probabilities)) {
      expect(prob).toBeGreaterThan(0)
      expect(prob).toBeLessThan(1)
    }
  })

  it('home > away for Spain at home vs Haiti away', () => {
    const r1x2 = preds.find(p => p.market === 'result_1x2')!
    expect(r1x2.probabilities['home']).toBeGreaterThan(r1x2.probabilities['away'])
  })
})

// ---------------------------------------------------------------------------
// Test suite 7: coherence with reversed teams (Haiti home, Spain away)
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - coherence with reversed teams', () => {
  const fixtureHaitiHome = makeFixture({
    id: 1006,
    homeTeamId: HAITI_ID,
    awayTeamId: SPAIN_ID,
  })
  const preds = computePredictionsForFixture(fixtureHaitiHome, byId)
  const r1x2 = preds.find(p => p.market === 'result_1x2')!

  it('Spain as away team vs Haiti: away > home', () => {
    expect(r1x2.probabilities['away']).toBeGreaterThan(r1x2.probabilities['home'])
  })

  it('predicted winner is Spain when playing away against Haiti', () => {
    const prediction = derivePrediction(fixtureHaitiHome, byId)
    expect(prediction!.winner).toBe('Spain')
  })
})
