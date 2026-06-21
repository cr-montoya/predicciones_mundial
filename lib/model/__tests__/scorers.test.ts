import { describe, it, expect } from 'vitest'
import { buildScorerOutputs } from '@/lib/model/scorers'
import type { PlayerScorerInput } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeInput(
  overrides: Partial<PlayerScorerInput> & { playerId: number; teamId: number }
): PlayerScorerInput {
  return {
    playerName: `Player${overrides.playerId}`,
    goalsPerMinute: 0.01,
    starterProbability: 1.0,
    lineupStatus: 'confirmed_starter',
    ...overrides,
  }
}

function sumProbs(probs: Record<string, number>): number {
  return Object.values(probs).reduce((a, b) => a + b, 0)
}

// ---------------------------------------------------------------------------
// Test 1: Lineup completo — todos titulares confirmados
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — lineup completo, todos titulares', () => {
  const homeInputs: PlayerScorerInput[] = [
    makeInput({ playerId: 1, teamId: 1, goalsPerMinute: 0.02 }),
    makeInput({ playerId: 2, teamId: 1, goalsPerMinute: 0.01 }),
  ]
  const awayInputs: PlayerScorerInput[] = [
    makeInput({ playerId: 3, teamId: 2, goalsPerMinute: 0.015 }),
    makeInput({ playerId: 4, teamId: 2, goalsPerMinute: 0.008 }),
  ]

  const { anytimeScorer, firstScorer } = buildScorerOutputs(
    homeInputs,
    awayInputs,
    1.5,
    1.2,
    'medium'
  )

  it('anytimeScorer.confidence es "medium"', () => {
    expect(anytimeScorer.confidence).toBe('medium')
  })

  it('modelVersion es "1.1"', () => {
    expect(anytimeScorer.modelVersion).toBe('1.1')
    expect(firstScorer.modelVersion).toBe('1.1')
  })

  it('anytime_scorer: todas las probabilidades estan en (0, 1)', () => {
    const entries = Object.entries(anytimeScorer.probabilities)
    expect(entries.length).toBeGreaterThan(0)
    for (const [, prob] of entries) {
      expect(prob).toBeGreaterThan(0)
      expect(prob).toBeLessThan(1)
    }
  })

  it('anytime_scorer: los 4 jugadores aparecen en probabilities', () => {
    const keys = Object.keys(anytimeScorer.probabilities)
    expect(keys).toContain('1_Player1')
    expect(keys).toContain('2_Player2')
    expect(keys).toContain('3_Player3')
    expect(keys).toContain('4_Player4')
  })

  it('first_scorer: suma de probabilidades (incluyendo no_scorer) ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('first_scorer: no_scorer esta presente', () => {
    expect(firstScorer.probabilities).toHaveProperty('no_scorer')
  })
})

// ---------------------------------------------------------------------------
// Test 2: Sin lineup — fallback por posicion (starterProbability parcial)
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — sin lineup, fallback por posicion', () => {
  const homeInputs: PlayerScorerInput[] = [
    makeInput({
      playerId: 10,
      teamId: 1,
      goalsPerMinute: 0.015,
      starterProbability: 0.7,
      lineupStatus: 'unknown',
    }),
  ]
  const awayInputs: PlayerScorerInput[] = [
    makeInput({
      playerId: 20,
      teamId: 2,
      goalsPerMinute: 0.015,
      starterProbability: 0.5,
      lineupStatus: 'unknown',
    }),
  ]

  const { anytimeScorer, firstScorer } = buildScorerOutputs(
    homeInputs,
    awayInputs,
    1.35,
    1.2,
    'low'
  )

  it('anytimeScorer.confidence es "low"', () => {
    expect(anytimeScorer.confidence).toBe('low')
  })

  it('anytime_scorer: ambos jugadores aparecen en probabilities', () => {
    expect(anytimeScorer.probabilities).toHaveProperty('10_Player10')
    expect(anytimeScorer.probabilities).toHaveProperty('20_Player20')
  })

  it('anytime_scorer: FW (sp=0.7) tiene mayor probabilidad que MF (sp=0.5)', () => {
    const pFW = anytimeScorer.probabilities['10_Player10']
    const pMF = anytimeScorer.probabilities['20_Player20']
    // Same lambda for both teams but FW has higher starterProbability
    // With same goalsPerMinute and single player per team, FW gets more lambda
    // lambdaFW = 0.7/(0.7) * 1.35 = 1.35, lambdaMF = 0.5/(0.5) * 1.2 = 1.2
    // So pFW = 1 - e^(-1.35) > pMF = 1 - e^(-1.2)
    expect(pFW).toBeGreaterThan(pMF)
  })

  it('first_scorer: suma de probabilidades ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })
})

// ---------------------------------------------------------------------------
// Test 3: Jugador lesionado excluido (starterProbability: 0.0)
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — jugador lesionado excluido', () => {
  const homeInputs: PlayerScorerInput[] = [
    makeInput({
      playerId: 30,
      teamId: 1,
      goalsPerMinute: 0.02,
      starterProbability: 0.0,
      lineupStatus: 'out',
    }),
    makeInput({
      playerId: 31,
      teamId: 1,
      goalsPerMinute: 0.01,
      starterProbability: 1.0,
      lineupStatus: 'confirmed_starter',
    }),
  ]
  const awayInputs: PlayerScorerInput[] = [
    makeInput({ playerId: 40, teamId: 2 }),
  ]

  const { anytimeScorer, firstScorer } = buildScorerOutputs(
    homeInputs,
    awayInputs,
    1.4,
    1.1,
    'medium'
  )

  it('anytime_scorer: el jugador con sp=0 NO aparece en probabilities', () => {
    const keys = Object.keys(anytimeScorer.probabilities)
    expect(keys).not.toContain('30_Player30')
  })

  it('anytime_scorer: el jugador activo (sp=1.0) SI aparece en probabilities', () => {
    expect(anytimeScorer.probabilities).toHaveProperty('31_Player31')
  })

  it('anytime_scorer: el jugador lesionado tiene effectiveRate=0 y es excluido sin error', () => {
    expect(() =>
      buildScorerOutputs(homeInputs, awayInputs, 1.4, 1.1, 'medium')
    ).not.toThrow()
  })

  it('first_scorer: suma de probabilidades ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })
})

// ---------------------------------------------------------------------------
// Test 4: Guard de denominador — todos los jugadores con starterProbability=0
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — guard denom=0, todos sp=0', () => {
  // Todos sp=0 => effectiveRate=0 para todos => denom=0 => fallback a goalsPerMinute
  // Pero en buildAnytime/buildFirst, "if (er === 0) continue" sigue activo,
  // asi que los jugadores NO aparecen en probs. firstScorer tendra no_scorer=1.0
  const homeInputs: PlayerScorerInput[] = [
    makeInput({
      playerId: 50,
      teamId: 1,
      goalsPerMinute: 0.02,
      starterProbability: 0.0,
      lineupStatus: 'out',
    }),
    makeInput({
      playerId: 51,
      teamId: 1,
      goalsPerMinute: 0.015,
      starterProbability: 0.0,
      lineupStatus: 'out',
    }),
  ]
  const awayInputs: PlayerScorerInput[] = [
    makeInput({
      playerId: 60,
      teamId: 2,
      goalsPerMinute: 0.01,
      starterProbability: 0.0,
      lineupStatus: 'out',
    }),
  ]

  let result: ReturnType<typeof buildScorerOutputs>

  it('no lanza durante buildScorerOutputs (sin errores de guard)', () => {
    expect(() => {
      result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    }).not.toThrow()
  })

  it('no hay NaN ni Infinity en anytime_scorer probabilities', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    for (const [, prob] of Object.entries(result.anytimeScorer.probabilities)) {
      expect(Number.isNaN(prob)).toBe(false)
      expect(Number.isFinite(prob)).toBe(true)
    }
  })

  it('no hay NaN ni Infinity en first_scorer probabilities', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    for (const [, prob] of Object.entries(result.firstScorer.probabilities)) {
      expect(Number.isNaN(prob)).toBe(false)
      expect(Number.isFinite(prob)).toBe(true)
    }
  })

  it('first_scorer: suma de probabilidades ≈ 1.0 (±0.001)', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    const total = sumProbs(result.firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('comportamiento observado: jugadores con sp=0 no aparecen en anytime_scorer (effectiveRate=0 los excluye)', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    // Con sp=0, effectiveRate=0 => el guard "if (er === 0) continue" los filtra
    // aunque buildWeights haga fallback a goalsPerMinute internamente
    const keys = Object.keys(result.anytimeScorer.probabilities)
    expect(keys).not.toContain('50_Player50')
    expect(keys).not.toContain('51_Player51')
    expect(keys).not.toContain('60_Player60')
  })
})

// ---------------------------------------------------------------------------
// Test 5: emptyOutput — arrays vacios en home y away
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — arrays vacios (emptyOutput)', () => {
  const { anytimeScorer, firstScorer } = buildScorerOutputs([], [], 1.3, 1.1, 'low')

  it('anytime_scorer.probabilities esta vacio', () => {
    expect(Object.keys(anytimeScorer.probabilities).length).toBe(0)
  })

  it('first_scorer.probabilities esta vacio', () => {
    expect(Object.keys(firstScorer.probabilities).length).toBe(0)
  })

  it('anytime_scorer.confidence es "low"', () => {
    expect(anytimeScorer.confidence).toBe('low')
  })

  it('first_scorer.confidence es "low"', () => {
    expect(firstScorer.confidence).toBe('low')
  })

  it('anytime_scorer.market es "anytime_scorer"', () => {
    expect(anytimeScorer.market).toBe('anytime_scorer')
  })

  it('first_scorer.market es "first_scorer"', () => {
    expect(firstScorer.market).toBe('first_scorer')
  })
})

// ---------------------------------------------------------------------------
// Test 6 (bonus): eligibleInputs — jugadores con goalsPerMinute=0 son excluidos
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — goalsPerMinute=0 excluye jugadores antes de calcular', () => {
  const homeInputs: PlayerScorerInput[] = [
    makeInput({ playerId: 70, teamId: 1, goalsPerMinute: 0.0, starterProbability: 1.0, lineupStatus: 'confirmed_starter' }),
  ]
  const awayInputs: PlayerScorerInput[] = [
    makeInput({ playerId: 80, teamId: 2, goalsPerMinute: 0.01, starterProbability: 1.0 }),
  ]

  const { anytimeScorer, firstScorer } = buildScorerOutputs(
    homeInputs,
    awayInputs,
    0.0,
    1.0,
    'low'
  )

  it('anytime_scorer: jugador con goalsPerMinute=0 no aparece', () => {
    expect(anytimeScorer.probabilities).not.toHaveProperty('70_Player70')
  })

  it('anytime_scorer: jugador activo SI aparece', () => {
    expect(anytimeScorer.probabilities).toHaveProperty('80_Player80')
  })

  it('first_scorer: suma ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })
})
