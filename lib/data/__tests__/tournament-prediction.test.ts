import { describe, it, expect } from 'vitest'
import tournamentPrediction from '@/lib/data/tournament-prediction.json'
import { sanityCheck, type ModelOutput } from '@/lib/types'

const winner = tournamentPrediction.winner as unknown as ModelOutput
const goldenBoot = tournamentPrediction.goldenBoot as unknown as ModelOutput

describe('tournament-prediction.json - estructura del winner', () => {
  it('el campo winner existe y tiene market = tournament_winner', () => {
    expect(winner).toBeDefined()
    expect(winner.market).toBe('tournament_winner')
  })

  it('el campo goldenBoot existe y tiene market = golden_boot', () => {
    expect(goldenBoot).toBeDefined()
    expect(goldenBoot.market).toBe('golden_boot')
  })

  it('winner.confidence es high | medium | low', () => {
    expect(['high', 'medium', 'low']).toContain(winner.confidence)
  })

  it('winner.modelVersion es una cadena no vacia', () => {
    expect(typeof winner.modelVersion).toBe('string')
    expect(winner.modelVersion.length).toBeGreaterThan(0)
  })

  it('winner.computedAt es un ISO 8601 valido', () => {
    const date = new Date(winner.computedAt)
    expect(date.toISOString()).toBe(winner.computedAt)
  })
})

describe('tournament-prediction.json - sanityCheck del winner', () => {
  it('sanityCheck no lanza: las probabilidades del winner suman 1.0 ± 0.001', () => {
    expect(() => sanityCheck(winner)).not.toThrow()
  })

  it('la suma de probabilidades es exactamente 1.0 ± 0.001', () => {
    const sum = Object.values(winner.probabilities).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('hay exactamente 48 equipos en winner.probabilities', () => {
    expect(Object.keys(winner.probabilities)).toHaveLength(48)
  })

  it('ninguna probabilidad es negativa', () => {
    for (const [team, prob] of Object.entries(winner.probabilities)) {
      expect(prob).toBeGreaterThanOrEqual(0)
    }
  })

  it('ninguna probabilidad es mayor a 1', () => {
    for (const [team, prob] of Object.entries(winner.probabilities)) {
      expect(prob).toBeLessThanOrEqual(1.0)
    }
  })

  it('no hay probabilidades degeneradas exactamente en 0 para los grandes favoritos', () => {
    const favorites = ['Spain', 'France', 'Brazil', 'Argentina', 'Germany']
    for (const fav of favorites) {
      const prob = winner.probabilities[fav as keyof typeof winner.probabilities]
      expect(prob).toBeDefined()
      expect(prob).toBeGreaterThan(0)
    }
  })
})

describe('tournament-prediction.json - jerarquia de favoritos', () => {
  const probs = winner.probabilities as Record<string, number>
  const ranked = Object.entries(probs).sort((a, b) => b[1] - a[1])

  it('Spain esta en el top 3 de favoritos', () => {
    const top3 = ranked.slice(0, 3).map(([name]) => name)
    expect(top3).toContain('Spain')
  })

  it('France esta en el top 3 de favoritos', () => {
    const top3 = ranked.slice(0, 3).map(([name]) => name)
    expect(top3).toContain('France')
  })

  it('Brazil esta en el top 5 de favoritos', () => {
    const top5 = ranked.slice(0, 5).map(([name]) => name)
    expect(top5).toContain('Brazil')
  })

  it('Argentina esta en el top 5 de favoritos', () => {
    const top5 = ranked.slice(0, 5).map(([name]) => name)
    expect(top5).toContain('Argentina')
  })

  it('Spain tiene mayor probabilidad que Haiti', () => {
    expect(probs['Spain']).toBeGreaterThan(probs['Haiti'])
  })

  it('France tiene mayor probabilidad que Panama', () => {
    expect(probs['France']).toBeGreaterThan(probs['Panama'])
  })

  it('France tiene mayor probabilidad que Saudi Arabia', () => {
    expect(probs['France']).toBeGreaterThan(probs['Saudi Arabia'])
  })

  it('Brazil tiene mayor probabilidad que Qatar', () => {
    expect(probs['Brazil']).toBeGreaterThan(probs['Qatar'])
  })

  it('Germany esta en el top 8 de favoritos', () => {
    const top8 = ranked.slice(0, 8).map(([name]) => name)
    expect(top8).toContain('Germany')
  })

  it('los favoritos top-3 tienen cada uno probabilidad > 5%', () => {
    const top3 = ranked.slice(0, 3)
    for (const [name, prob] of top3) {
      expect(prob).toBeGreaterThan(0.05)
    }
  })

  it('los equipos mas debiles (Haiti, Panama, Saudi Arabia) tienen probabilidad < 2%', () => {
    const weak = ['Haiti', 'Panama', 'Saudi Arabia']
    for (const name of weak) {
      expect(probs[name]).toBeLessThan(0.02)
    }
  })
})

describe('tournament-prediction.json - coherencia de todos los equipos', () => {
  const probs = winner.probabilities as Record<string, number>

  it('todos los 48 equipos del Mundial estan en el JSON', () => {
    const expected48 = [
      'Mexico', 'South Korea', 'South Africa', 'Czechia',
      'Switzerland', 'Canada', 'Bosnia-Herzegovina', 'Qatar',
      'Brazil', 'Morocco', 'Haiti', 'Scotland',
      'United States', 'Australia', 'Turkey', 'Paraguay',
      'Ecuador', 'Germany', 'Ivory Coast', 'Curaçao',
      'Japan', 'Sweden', 'Tunisia', 'Netherlands',
      'Belgium', 'New Zealand', 'Egypt', 'Iran',
      'Uruguay', 'Spain', 'Saudi Arabia', 'Cape Verde Islands',
      'France', 'Senegal', 'Iraq', 'Norway',
      'Argentina', 'Algeria', 'Austria', 'Jordan',
      'Colombia', 'Portugal', 'Congo DR', 'Uzbekistan',
      'England', 'Croatia', 'Ghana', 'Panama',
    ]
    for (const name of expected48) {
      expect(probs[name]).toBeDefined()
    }
  })
})
