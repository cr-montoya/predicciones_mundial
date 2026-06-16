import { describe, it, expect } from 'vitest'
import { computeMatchOutputs, type MatchInput } from '@/lib/model/match-model'
import { sanityCheck, type Team, type Fixture } from '@/lib/types'
import { buildScoreMatrix } from '@/lib/model/skills/score-matrix'
import { deriveTeamTotal, deriveWinToNil } from '@/lib/model/skills/derive-markets'

// Datos sinteticos, sin DB, sin imports externos
const strongTeam: Team = {
  id: 1,
  name: 'Brazil',
  group: 'B',
  fifaRanking: 1,
  attackStrength: 1.8,
  defenseStrength: 0.7,
  homeAdvantage: 1.0,
  recentForm: 1.1,
  avgGoalsScored: 2.0,
  avgGoalsConceded: 0.8,
}

const weakTeam: Team = {
  id: 2,
  name: 'Minnow',
  group: 'B',
  fifaRanking: 80,
  attackStrength: 0.6,
  defenseStrength: 1.5,
  homeAdvantage: 1.0,
  recentForm: 0.9,
  avgGoalsScored: 0.8,
  avgGoalsConceded: 2.0,
}

const fixture: Fixture = {
  id: 1,
  homeTeamId: 1,
  awayTeamId: 2,
  kickoffUtc: '2026-06-15T18:00:00Z',
  status: 'scheduled',
  homeGoals: null,
  awayGoals: null,
  round: 'group',
}

const input: MatchInput = {
  fixture,
  home: strongTeam,
  away: weakTeam,
  matchStats: [],
  homePlayers: [],
  awayPlayers: [],
}

describe('computeMatchOutputs', () => {
  const outputs = computeMatchOutputs(input)

  it('devuelve al menos 1 ModelOutput', () => {
    expect(outputs.length).toBeGreaterThanOrEqual(1)
  })

  it('sanityCheck no lanza para mercados result_1x2, over_under_goals_*, btts', () => {
    const targetMarkets = new Set(['result_1x2', 'over_under_goals_1_5', 'over_under_goals_2_5', 'over_under_goals_3_5', 'btts'])
    const relevant = outputs.filter(o => targetMarkets.has(o.market))
    expect(relevant.length).toBeGreaterThan(0)
    for (const output of relevant) {
      expect(() => sanityCheck(output)).not.toThrow()
    }
  })

  it('para result_1x2: Brazil (home) tiene probabilidad de ganar > 0.5', () => {
    const result1x2 = outputs.find(o => o.market === 'result_1x2')
    expect(result1x2).toBeDefined()
    expect(result1x2!.probabilities['home']).toBeGreaterThan(0.5)
  })

  it('ninguna probabilidad esta fuera de [0, 1]', () => {
    for (const output of outputs) {
      for (const [key, prob] of Object.entries(output.probabilities)) {
        expect(prob).toBeGreaterThanOrEqual(0)
        expect(prob).toBeLessThanOrEqual(1)
      }
    }
  })

  it('computedAt es un ISO 8601 valido en cada output', () => {
    for (const output of outputs) {
      const date = new Date(output.computedAt)
      expect(date.toISOString()).toBe(output.computedAt)
    }
  })

  it('modelVersion es una cadena no vacia en cada output', () => {
    for (const output of outputs) {
      expect(typeof output.modelVersion).toBe('string')
      expect(output.modelVersion.length).toBeGreaterThan(0)
    }
  })

  it('confidence es high | medium | low en cada output', () => {
    const validLevels = new Set(['high', 'medium', 'low'])
    for (const output of outputs) {
      expect(validLevels.has(output.confidence)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Fase 16: 7 nuevos mercados team totals + win_to_nil
// ---------------------------------------------------------------------------

describe('computeMatchOutputs — Fase 16: count y sanity de nuevos mercados', () => {
  const outputs = computeMatchOutputs(input)

  const NEW_MARKETS = [
    'home_team_goals_0_5',
    'home_team_goals_1_5',
    'home_team_goals_2_5',
    'away_team_goals_0_5',
    'away_team_goals_1_5',
    'away_team_goals_2_5',
    'win_to_nil',
  ] as const

  it('el total de outputs es 20 (13 pre-existentes + 7 nuevos)', () => {
    expect(outputs.length).toBe(20)
  })

  it('los 7 nuevos mercados estan presentes en el output', () => {
    const markets = new Set(outputs.map(o => o.market))
    for (const m of NEW_MARKETS) {
      expect(markets.has(m)).toBe(true)
    }
  })

  it('sanityCheck no lanza para los 6 mercados de team totals', () => {
    const teamTotalMarkets = NEW_MARKETS.filter(m => m !== 'win_to_nil')
    for (const market of teamTotalMarkets) {
      const output = outputs.find(o => o.market === market)
      expect(output).toBeDefined()
      expect(() => sanityCheck(output!)).not.toThrow()
    }
  })

  it('win_to_nil: home y away estan en [0, 1] y no suman 1', () => {
    const winNil = outputs.find(o => o.market === 'win_to_nil')
    expect(winNil).toBeDefined()
    const { home, away } = winNil!.probabilities
    expect(home).toBeGreaterThanOrEqual(0)
    expect(home).toBeLessThanOrEqual(1)
    expect(away).toBeGreaterThanOrEqual(0)
    expect(away).toBeLessThanOrEqual(1)
    expect(Math.abs(home + away - 1.0)).toBeGreaterThan(0.01)
  })

  it('todos los nuevos outputs tienen confidence valido', () => {
    const validLevels = new Set(['high', 'medium', 'low'])
    for (const market of NEW_MARKETS) {
      const output = outputs.find(o => o.market === market)
      expect(output).toBeDefined()
      expect(validLevels.has(output!.confidence)).toBe(true)
    }
  })
})

describe('computeMatchOutputs — Fase 16: confidence rules de team total', () => {
  it('home team goals 0.5: confidence high cuando lambdaHome=3.0 (p(over) muy alto)', () => {
    // Con lambdaHome=3.0 el equipo local anota en casi todos los partidos
    const matrix = buildScoreMatrix(3.0, 1.0)
    const { over } = deriveTeamTotal(matrix, 'home', 0.5)
    // Verificar que el over supera el umbral de 0.70 que activa 'high'
    expect(over).toBeGreaterThanOrEqual(0.70)
  })

  it('away team goals 0.5: confidence high cuando lambdaAway=3.0', () => {
    const matrix = buildScoreMatrix(1.0, 3.0)
    const { over } = deriveTeamTotal(matrix, 'away', 0.5)
    expect(over).toBeGreaterThanOrEqual(0.70)
  })

  it('win_to_nil: confidence low cuando lambdas iguales y moderados (1.35, 1.35)', () => {
    const matrix = buildScoreMatrix(1.35, 1.35)
    const winNilProbs = deriveWinToNil(matrix)
    const pMax = Math.max(winNilProbs.home, winNilProbs.away)
    // Con equipos iguales y moderados, pMax debe ser < 0.30 (umbral de 'medium')
    expect(pMax).toBeLessThan(0.30)
  })
})
