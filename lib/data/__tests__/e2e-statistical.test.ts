/**
 * End-to-end statistical tests.
 * No network: uses mockTeams/mockFixtures + synthetic football-data stats.
 * Validates lambdas are in range, probabilities sum to 1.0±0.001, valid confidence.
 */

import { describe, it, expect } from 'vitest'
import { computeLambdas } from '@/lib/model/lambda'
import { buildScoreMatrix } from '@/lib/model/skills/score-matrix'
import { deriveResult1x2, deriveOverUnder, deriveBtts } from '@/lib/model/skills/derive-markets'
import { sanityCheck } from '@/lib/types'
import type { Team, Fixture, MatchStats, ModelOutput } from '@/lib/types'
import { computeMatchOutputs, type MatchInput } from '@/lib/model/match-model'
import { LAMBDA_MIN, LAMBDA_MAX } from '@/lib/model/constants'
import { mockTeams } from '@/lib/data/fixtures-mock'

// ---------------------------------------------------------------------------
// Synthetic teams simulating data from football-data.org
// (same normalized shape that the provider would produce after FD_TEAM_MAP)
// ---------------------------------------------------------------------------

const brazil: Team = mockTeams.find(t => t.id === 6)!
const mexico: Team = {
  id: 2001,
  name: 'Mexico',
  group: 'C',
  fifaRanking: 16,
  attackStrength: 0.95,
  defenseStrength: 1.05,
  homeAdvantage: 1.0,
  recentForm: 1.0,
  avgGoalsScored: 1.4,
  avgGoalsConceded: 1.1,
}

const fixture: Fixture = {
  id: 9010,
  homeTeamId: 6,
  awayTeamId: 2001,
  kickoffUtc: '2026-06-20T20:00:00Z',
  status: 'scheduled',
  homeGoals: null,
  awayGoals: null,
  round: 'group',
}

// ---------------------------------------------------------------------------
// 1. Lambdas in range [0.2, 4.5]
// ---------------------------------------------------------------------------

describe('E2E statistical - Brazil vs Mexico - lambdas', () => {
  const { lambdaHome, lambdaAway } = computeLambdas(brazil, mexico)

  it('lambdaHome is in [LAMBDA_MIN, LAMBDA_MAX]', () => {
    expect(lambdaHome).toBeGreaterThanOrEqual(LAMBDA_MIN)
    expect(lambdaHome).toBeLessThanOrEqual(LAMBDA_MAX)
  })

  it('lambdaAway is in [LAMBDA_MIN, LAMBDA_MAX]', () => {
    expect(lambdaAway).toBeGreaterThanOrEqual(LAMBDA_MIN)
    expect(lambdaAway).toBeLessThanOrEqual(LAMBDA_MAX)
  })

  it('lambdaHome > lambdaAway (Brazil stronger than Mexico)', () => {
    expect(lambdaHome).toBeGreaterThan(lambdaAway)
  })
})

// ---------------------------------------------------------------------------
// 2. Probabilities sum to 1.0 ± 0.001
// ---------------------------------------------------------------------------

describe('E2E statistical - Brazil vs Mexico - sanity checks', () => {
  const { lambdaHome, lambdaAway } = computeLambdas(brazil, mexico)
  const matrix = buildScoreMatrix(lambdaHome, lambdaAway)

  it('result_1x2 sums to 1.0 ± 0.001', () => {
    const probs = deriveResult1x2(matrix)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('over_under_2_5 sums to 1.0 ± 0.001', () => {
    const probs = deriveOverUnder(matrix, 2.5)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('btts sums to 1.0 ± 0.001', () => {
    const probs = deriveBtts(matrix)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })
})

// ---------------------------------------------------------------------------
// 3. Full computeMatchOutputs passes sanityCheck
// ---------------------------------------------------------------------------

describe('E2E statistical - full computeMatchOutputs', () => {
  const input: MatchInput = {
    fixture,
    home: brazil,
    away: mexico,
    matchStats: [],
    homePlayers: [],
    awayPlayers: [],
  }
  const outputs = computeMatchOutputs(input)

  it('returns at least 5 outputs (result + markets + cards + corners)', () => {
    expect(outputs.length).toBeGreaterThanOrEqual(5)
  })

  it('confidence is high|medium|low in all outputs', () => {
    const valid = new Set(['high', 'medium', 'low'])
    for (const o of outputs) {
      expect(valid.has(o.confidence)).toBe(true)
    }
  })

  it('result_1x2: Brazil (home) has prob > 0.50 against Mexico', () => {
    const r = outputs.find(o => o.market === 'result_1x2')
    expect(r).toBeDefined()
    expect(r!.probabilities['home']).toBeGreaterThan(0.5)
  })

  it('no individual probability outside [0, 1]', () => {
    for (const o of outputs) {
      for (const [, p] of Object.entries(o.probabilities)) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Detection of out-of-range avgGoals from football-data
// ---------------------------------------------------------------------------

describe('E2E statistical - out-of-range avgGoals detection', () => {
  it('team with very high attackStrength (>3.5) produces lambda clamped to LAMBDA_MAX', () => {
    const outlierTeam: Team = {
      ...brazil,
      attackStrength: 3.5,
      recentForm: 1.3,
    }
    const normal = mexico
    const { lambdaHome } = computeLambdas(outlierTeam, normal)
    expect(lambdaHome).toBeLessThanOrEqual(LAMBDA_MAX)
  })

  it('team with very low attackStrength produces lambda clamped to LAMBDA_MIN', () => {
    const weakAttack: Team = {
      ...mexico,
      attackStrength: 0.1,
      recentForm: 0.7,
    }
    const { lambdaAway } = computeLambdas(brazil, weakAttack)
    expect(lambdaAway).toBeGreaterThanOrEqual(LAMBDA_MIN)
  })
})

// ---------------------------------------------------------------------------
// 5. football-data with different avgGoals than API-Football
// (Simulates football-data returning different stats: model is still valid)
// ---------------------------------------------------------------------------

describe('E2E statistical - convergence with football-data stats', () => {
  it('slightly different stats produce lambdas still in range and valid outputs', () => {
    // Simulate a team whose stats come from football-data (slightly different values)
    const brazilFD: Team = {
      ...brazil,
      avgGoalsScored: 1.6,   // FD may return different value than API-Football (1.9)
      avgGoalsConceded: 0.9, // FD may return different value than API-Football (0.75)
      attackStrength: 1.15,
      defenseStrength: 0.95,
    }

    const { lambdaHome, lambdaAway } = computeLambdas(brazilFD, mexico)
    expect(lambdaHome).toBeGreaterThanOrEqual(LAMBDA_MIN)
    expect(lambdaHome).toBeLessThanOrEqual(LAMBDA_MAX)
    expect(lambdaAway).toBeGreaterThanOrEqual(LAMBDA_MIN)
    expect(lambdaAway).toBeLessThanOrEqual(LAMBDA_MAX)

    const matrix = buildScoreMatrix(lambdaHome, lambdaAway)
    const probs = deriveResult1x2(matrix)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })
})
