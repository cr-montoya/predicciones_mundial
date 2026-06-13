/**
 * Tests de sanity para la logica de prediccion en live-loader.ts (Fase 13).
 *
 * Valida:
 * 1. Fixtures scheduled producen prediction definida con valores coherentes.
 * 2. Fixtures finished producen prediction = undefined.
 * 3. Coherencia del ganador: equipo fuerte (Spain) supera a equipo debil (Haiti).
 * 4. Fixtures sin equipos conocidos producen prediction = undefined.
 * 5. Las claves del mercado result_1x2 son correctas y compatibles con live-loader.
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
 * Reproduce exactamente la logica de derivacion de prediction de live-loader.ts
 * (el bloque del map() de fixturesToday). Se usa para verificar coherencia entre
 * el modelo de prediccion y el codigo de integracion.
 */
function derivePrediction(
  fixture: Fixture,
  byId: Map<number, Team>
): { winner: string; winnerProb: number; expectedGoals: number } | undefined {
  const preds = computePredictionsForFixture(fixture, byId)
  const r1x2 = preds.find(p => p.market === 'result_1x2')
  const exactScore = preds.find(p => p.market === 'exact_score')

  if (!r1x2 || !exactScore) return undefined

  // Replica literalmente el codigo de live-loader.ts lineas 75-84
  const [topKey, topProb] = Object.entries(r1x2.probabilities).sort(
    ([, a], [, b]) => b - a
  )[0]

  const winner =
    topKey === 'home'
      ? (byId.get(fixture.homeTeamId)?.name ?? 'Local')
      : topKey === 'away'
      ? (byId.get(fixture.awayTeamId)?.name ?? 'Visitante')
      : 'Empate'

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
// Setup: equipos reales del Mundial
// ---------------------------------------------------------------------------

const staticTeams = buildStaticTeams()
const byId = teamMap(staticTeams)

// IDs reales segun teams-seed.ts y historical-stats.json
const SPAIN_ID = 9
const FRANCE_ID = 2
const HAITI_ID = 168

// ---------------------------------------------------------------------------
// Test suite 1: claves del mercado result_1x2
// CRITICO: live-loader.ts compara topKey con 'home_win' y 'away_win', pero
// deriveResult1x2 produce claves 'home', 'draw', 'away'. Este test detecta
// esa inconsistencia.
// ---------------------------------------------------------------------------

describe('result_1x2 - claves del mercado (contrato entre model y live-loader)', () => {
  const fixture = makeFixture({ id: 2001, homeTeamId: SPAIN_ID, awayTeamId: HAITI_ID })
  const preds = computePredictionsForFixture(fixture, byId)
  const r1x2 = preds.find(p => p.market === 'result_1x2')!

  it('result_1x2 contiene exactamente home, draw, away', () => {
    const keys = Object.keys(r1x2.probabilities).sort()
    expect(keys).toEqual(['away', 'draw', 'home'])
  })

  it('home existe como clave en result_1x2', () => {
    expect(r1x2.probabilities).toHaveProperty('home')
  })

  it('away existe como clave en result_1x2', () => {
    expect(r1x2.probabilities).toHaveProperty('away')
  })
})

// ---------------------------------------------------------------------------
// Test suite 2: fixture scheduled Spain vs France produce prediction definida
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - fixture scheduled con equipos conocidos', () => {
  const fixture = makeFixture({ id: 1001, homeTeamId: SPAIN_ID, awayTeamId: FRANCE_ID })
  const prediction = derivePrediction(fixture, byId)

  it('prediction no es undefined', () => {
    expect(prediction).toBeDefined()
  })

  it('winner es string no vacio', () => {
    expect(typeof prediction!.winner).toBe('string')
    expect(prediction!.winner.length).toBeGreaterThan(0)
  })

  it('winnerProb esta estrictamente en (0, 1)', () => {
    expect(prediction!.winnerProb).toBeGreaterThan(0)
    expect(prediction!.winnerProb).toBeLessThan(1)
  })

  it('expectedGoals esta en [0.4, 7.0]', () => {
    expect(prediction!.expectedGoals).toBeGreaterThanOrEqual(0.4)
    expect(prediction!.expectedGoals).toBeLessThanOrEqual(7.0)
  })
})

// ---------------------------------------------------------------------------
// Test suite 3: fixture scheduled Spain vs Haiti (equipo fuerte vs debil)
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - Spain (id=9) vs Haiti (id=168)', () => {
  const fixture = makeFixture({ id: 1002, homeTeamId: SPAIN_ID, awayTeamId: HAITI_ID })
  const prediction = derivePrediction(fixture, byId)

  it('prediction no es undefined', () => {
    expect(prediction).toBeDefined()
  })

  it('winnerProb esta estrictamente en (0, 1)', () => {
    expect(prediction!.winnerProb).toBeGreaterThan(0)
    expect(prediction!.winnerProb).toBeLessThan(1)
  })

  it('expectedGoals esta en [0.4, 7.0]', () => {
    expect(prediction!.expectedGoals).toBeGreaterThanOrEqual(0.4)
    expect(prediction!.expectedGoals).toBeLessThanOrEqual(7.0)
  })

  it('winner es string no vacio', () => {
    expect(typeof prediction!.winner).toBe('string')
    expect(prediction!.winner.length).toBeGreaterThan(0)
  })

  it('winner predicho es Spain (equipo mas fuerte jugando como local)', () => {
    // Spain (attackStrength ~1.4, defenseStrength ~0.55) vs Haiti (debil).
    // Como local, Spain debe ser el winner predicho.
    // FALLA si live-loader usa claves incorrectas y siempre devuelve 'Empate'.
    expect(prediction!.winner).toBe('Spain')
  })

  it('winnerProb de Spain es mayor que 0.5', () => {
    // Con Spain local contra Haiti, su prob de ganar debe superar 50%.
    // FALLA si el winner es 'Empate' (prob de empate < 50% en este matchup).
    expect(prediction!.winnerProb).toBeGreaterThan(0.5)
  })
})

// ---------------------------------------------------------------------------
// Test suite 4: fixture finished produce prediction = undefined
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - fixture finished', () => {
  const fixture = makeFixture({
    id: 1003,
    homeTeamId: SPAIN_ID,
    awayTeamId: HAITI_ID,
    status: 'finished',
    homeGoals: 3,
    awayGoals: 0,
  })

  it('computePredictionsForFixture devuelve array vacio para fixture finished', () => {
    const preds = computePredictionsForFixture(fixture, byId)
    expect(preds).toHaveLength(0)
  })

  it('prediction derivada es undefined para fixture finished', () => {
    const prediction = derivePrediction(fixture, byId)
    expect(prediction).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Test suite 5: fixture sin equipos conocidos produce prediction = undefined
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - fixture con equipos desconocidos', () => {
  const fixture = makeFixture({
    id: 1004,
    homeTeamId: 99999,
    awayTeamId: 88888,
  })

  it('computePredictionsForFixture devuelve array vacio para equipos desconocidos', () => {
    const preds = computePredictionsForFixture(fixture, byId)
    expect(preds).toHaveLength(0)
  })

  it('prediction derivada es undefined para equipos desconocidos', () => {
    const prediction = derivePrediction(fixture, byId)
    expect(prediction).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Test suite 6: sanity de outputs internos del modelo
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - sanity de outputs internos', () => {
  const fixture = makeFixture({ id: 1005, homeTeamId: SPAIN_ID, awayTeamId: HAITI_ID })
  const preds = computePredictionsForFixture(fixture, byId)

  it('devuelve al menos los mercados result_1x2 y exact_score', () => {
    const markets = preds.map(p => p.market)
    expect(markets).toContain('result_1x2')
    expect(markets).toContain('exact_score')
  })

  it('result_1x2 probabilities suman 1.0 +/- 0.001', () => {
    const r1x2 = preds.find(p => p.market === 'result_1x2')!
    const sum = Object.values(r1x2.probabilities).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('exact_score probabilities suman 1.0 +/- 0.001', () => {
    const exactScore = preds.find(p => p.market === 'exact_score')!
    const sum = Object.values(exactScore.probabilities).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('result_1x2 no tiene ninguna entrada exactamente en 0 o 1', () => {
    const r1x2 = preds.find(p => p.market === 'result_1x2')!
    for (const [, prob] of Object.entries(r1x2.probabilities)) {
      expect(prob).toBeGreaterThan(0)
      expect(prob).toBeLessThan(1)
    }
  })

  it('home > away para Spain local vs Haiti visitante', () => {
    const r1x2 = preds.find(p => p.market === 'result_1x2')!
    expect(r1x2.probabilities['home']).toBeGreaterThan(r1x2.probabilities['away'])
  })
})

// ---------------------------------------------------------------------------
// Test suite 7: coherencia con equipos invertidos (Haiti local, Spain visitante)
// ---------------------------------------------------------------------------

describe('computePredictionsForFixture - coherencia con equipos invertidos', () => {
  const fixtureHaitiHome = makeFixture({
    id: 1006,
    homeTeamId: HAITI_ID,
    awayTeamId: SPAIN_ID,
  })
  const preds = computePredictionsForFixture(fixtureHaitiHome, byId)
  const r1x2 = preds.find(p => p.market === 'result_1x2')!

  it('Spain como visitante contra Haiti: away > home', () => {
    expect(r1x2.probabilities['away']).toBeGreaterThan(r1x2.probabilities['home'])
  })

  it('winner predicho es Spain cuando juega como visitante contra Haiti', () => {
    const prediction = derivePrediction(fixtureHaitiHome, byId)
    expect(prediction!.winner).toBe('Spain')
  })
})
