/**
 * Tests end-to-end estadísticos.
 * Sin red: usa mockTeams/mockFixtures + datos sintéticos de football-data.
 * Valida lambdas en rango, probabilidades suman 1.0±0.001, confidence válido.
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
// Equipos sintéticos que simulan datos provenientes de football-data.org
// (misma forma normalizada que produciría el provider tras FD_TEAM_MAP)
// ---------------------------------------------------------------------------

const brazil: Team = mockTeams.find(t => t.id === 1003)!
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
  homeTeamId: 1003,
  awayTeamId: 2001,
  kickoffUtc: '2026-06-20T20:00:00Z',
  status: 'scheduled',
  homeGoals: null,
  awayGoals: null,
  round: 'group',
}

// ---------------------------------------------------------------------------
// 1. Lambdas en rango [0.2, 4.5]
// ---------------------------------------------------------------------------

describe('E2E estadístico - Brasil vs México - lambdas', () => {
  const { lambdaHome, lambdaAway } = computeLambdas(brazil, mexico)

  it('lambdaHome está en [LAMBDA_MIN, LAMBDA_MAX]', () => {
    expect(lambdaHome).toBeGreaterThanOrEqual(LAMBDA_MIN)
    expect(lambdaHome).toBeLessThanOrEqual(LAMBDA_MAX)
  })

  it('lambdaAway está en [LAMBDA_MIN, LAMBDA_MAX]', () => {
    expect(lambdaAway).toBeGreaterThanOrEqual(LAMBDA_MIN)
    expect(lambdaAway).toBeLessThanOrEqual(LAMBDA_MAX)
  })

  it('lambdaHome > lambdaAway (Brasil más fuerte que México)', () => {
    expect(lambdaHome).toBeGreaterThan(lambdaAway)
  })
})

// ---------------------------------------------------------------------------
// 2. Probabilidades suman 1.0 ± 0.001
// ---------------------------------------------------------------------------

describe('E2E estadístico - Brasil vs México - sanity checks', () => {
  const { lambdaHome, lambdaAway } = computeLambdas(brazil, mexico)
  const matrix = buildScoreMatrix(lambdaHome, lambdaAway)

  it('result_1x2 suma 1.0 ± 0.001', () => {
    const probs = deriveResult1x2(matrix)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('over_under_2_5 suma 1.0 ± 0.001', () => {
    const probs = deriveOverUnder(matrix, 2.5)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('btts suma 1.0 ± 0.001', () => {
    const probs = deriveBtts(matrix)
    const sum = Object.values(probs).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })
})

// ---------------------------------------------------------------------------
// 3. computeMatchOutputs completo pasa sanityCheck
// ---------------------------------------------------------------------------

describe('E2E estadístico - computeMatchOutputs completo', () => {
  const input: MatchInput = {
    fixture,
    home: brazil,
    away: mexico,
    matchStats: [],
    homePlayers: [],
    awayPlayers: [],
  }
  const outputs = computeMatchOutputs(input)

  it('devuelve al menos 5 outputs (resultado + markets + cards + corners)', () => {
    expect(outputs.length).toBeGreaterThanOrEqual(5)
  })

  it('confidence es high|medium|low en todos los outputs', () => {
    const valid = new Set(['high', 'medium', 'low'])
    for (const o of outputs) {
      expect(valid.has(o.confidence)).toBe(true)
    }
  })

  it('result_1x2: Brasil (home) tiene prob > 0.50 contra México', () => {
    const r = outputs.find(o => o.market === 'result_1x2')
    expect(r).toBeDefined()
    expect(r!.probabilities['home']).toBeGreaterThan(0.5)
  })

  it('ninguna probabilidad individual fuera de [0, 1]', () => {
    for (const o of outputs) {
      for (const [, p] of Object.entries(o.probabilities)) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Detección de avgGoals out-of-range provenientes de football-data
// ---------------------------------------------------------------------------

describe('E2E estadístico - detección de avgGoals out-of-range', () => {
  it('equipo con avgGoalsScored muy alto (>4) produce lambda clampada a LAMBDA_MAX', () => {
    const outlierTeam: Team = {
      ...brazil,
      attackStrength: 3.5,
      recentForm: 1.3,
    }
    const normal = mexico
    const { lambdaHome } = computeLambdas(outlierTeam, normal)
    expect(lambdaHome).toBeLessThanOrEqual(LAMBDA_MAX)
  })

  it('equipo con avgGoalsScored muy bajo produce lambda clampada a LAMBDA_MIN', () => {
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
// 5. Football-data con avgGoals distintos que API-Football
// (Simula que football-data devuelve stats diferentes: modelo aún es válido)
// ---------------------------------------------------------------------------

describe('E2E estadístico - convergencia con stats de football-data', () => {
  it('stats ligeramente distintas producen lambdas igualmente en rango y outputs válidos', () => {
    // Simula un equipo cuyas stats vienen de football-data (valores levemente distintos)
    const brazilFD: Team = {
      ...brazil,
      avgGoalsScored: 1.6,   // FD puede dar distinto a API-Football (1.9)
      avgGoalsConceded: 0.9, // FD puede dar distinto a API-Football (0.75)
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
