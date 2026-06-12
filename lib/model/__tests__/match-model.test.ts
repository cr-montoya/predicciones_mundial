import { describe, it, expect } from 'vitest'
import { computeMatchOutputs, type MatchInput } from '@/lib/model/match-model'
import { sanityCheck, type Team, type Fixture } from '@/lib/types'

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
