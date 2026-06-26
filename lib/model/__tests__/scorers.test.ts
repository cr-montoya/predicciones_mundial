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
// Test 1: Full lineup — all confirmed starters
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — full lineup, all starters', () => {
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

  it('anytimeScorer.confidence is "medium"', () => {
    expect(anytimeScorer.confidence).toBe('medium')
  })

  it('modelVersion is "1.1"', () => {
    expect(anytimeScorer.modelVersion).toBe('1.1')
    expect(firstScorer.modelVersion).toBe('1.1')
  })

  it('anytime_scorer: all probabilities are in (0, 1)', () => {
    const entries = Object.entries(anytimeScorer.probabilities)
    expect(entries.length).toBeGreaterThan(0)
    for (const [, prob] of entries) {
      expect(prob).toBeGreaterThan(0)
      expect(prob).toBeLessThan(1)
    }
  })

  it('anytime_scorer: all 4 players appear in probabilities', () => {
    const keys = Object.keys(anytimeScorer.probabilities)
    expect(keys).toContain('1_Player1')
    expect(keys).toContain('2_Player2')
    expect(keys).toContain('3_Player3')
    expect(keys).toContain('4_Player4')
  })

  it('first_scorer: sum of probabilities (including no_scorer) ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('first_scorer: no_scorer is present', () => {
    expect(firstScorer.probabilities).toHaveProperty('no_scorer')
  })
})

// ---------------------------------------------------------------------------
// Test 2: No lineup — position-based fallback (partial starterProbability)
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — no lineup, position-based fallback', () => {
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

  it('anytimeScorer.confidence is "low"', () => {
    expect(anytimeScorer.confidence).toBe('low')
  })

  it('anytime_scorer: both players appear in probabilities', () => {
    expect(anytimeScorer.probabilities).toHaveProperty('10_Player10')
    expect(anytimeScorer.probabilities).toHaveProperty('20_Player20')
  })

  it('anytime_scorer: FW (sp=0.7) has higher probability than MF (sp=0.5)', () => {
    const pFW = anytimeScorer.probabilities['10_Player10']
    const pMF = anytimeScorer.probabilities['20_Player20']
    // Same lambda for both teams but FW has higher starterProbability
    // With same goalsPerMinute and single player per team, FW gets more lambda
    // lambdaFW = 0.7/(0.7) * 1.35 = 1.35, lambdaMF = 0.5/(0.5) * 1.2 = 1.2
    // So pFW = 1 - e^(-1.35) > pMF = 1 - e^(-1.2)
    expect(pFW).toBeGreaterThan(pMF)
  })

  it('first_scorer: sum of probabilities ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })
})

// ---------------------------------------------------------------------------
// Test 3: Injured player excluded (starterProbability: 0.0)
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — injured player excluded', () => {
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

  it('anytime_scorer: player with sp=0 does NOT appear in probabilities', () => {
    const keys = Object.keys(anytimeScorer.probabilities)
    expect(keys).not.toContain('30_Player30')
  })

  it('anytime_scorer: active player (sp=1.0) DOES appear in probabilities', () => {
    expect(anytimeScorer.probabilities).toHaveProperty('31_Player31')
  })

  it('anytime_scorer: injured player has effectiveRate=0 and is excluded without error', () => {
    expect(() =>
      buildScorerOutputs(homeInputs, awayInputs, 1.4, 1.1, 'medium')
    ).not.toThrow()
  })

  it('first_scorer: sum of probabilities ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })
})

// ---------------------------------------------------------------------------
// Test 4: Denominator guard — all players with starterProbability=0
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — denominator guard, all sp=0', () => {
  // All sp=0 => effectiveRate=0 for all => denom=0 => fallback to goalsPerMinute
  // But in buildAnytime/buildFirst "if (er === 0) continue" is still active,
  // so players do NOT appear in probs. firstScorer will have no_scorer=1.0
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

  it('does not throw during buildScorerOutputs (no guard errors)', () => {
    expect(() => {
      result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    }).not.toThrow()
  })

  it('no NaN or Infinity in anytime_scorer probabilities', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    for (const [, prob] of Object.entries(result.anytimeScorer.probabilities)) {
      expect(Number.isNaN(prob)).toBe(false)
      expect(Number.isFinite(prob)).toBe(true)
    }
  })

  it('no NaN or Infinity in first_scorer probabilities', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    for (const [, prob] of Object.entries(result.firstScorer.probabilities)) {
      expect(Number.isNaN(prob)).toBe(false)
      expect(Number.isFinite(prob)).toBe(true)
    }
  })

  it('first_scorer: sum of probabilities ≈ 1.0 (±0.001)', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    const total = sumProbs(result.firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('observed behavior: players with sp=0 do not appear in anytime_scorer (effectiveRate=0 filters them out)', () => {
    result = buildScorerOutputs(homeInputs, awayInputs, 1.2, 1.0, 'low')
    // With sp=0, effectiveRate=0 => the guard "if (er === 0) continue" filters them
    // even if buildWeights falls back to goalsPerMinute internally
    const keys = Object.keys(result.anytimeScorer.probabilities)
    expect(keys).not.toContain('50_Player50')
    expect(keys).not.toContain('51_Player51')
    expect(keys).not.toContain('60_Player60')
  })
})

// ---------------------------------------------------------------------------
// Test 5: emptyOutput — empty home and away arrays
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — empty arrays (emptyOutput)', () => {
  const { anytimeScorer, firstScorer } = buildScorerOutputs([], [], 1.3, 1.1, 'low')

  it('anytime_scorer.probabilities is empty', () => {
    expect(Object.keys(anytimeScorer.probabilities).length).toBe(0)
  })

  it('first_scorer.probabilities is empty', () => {
    expect(Object.keys(firstScorer.probabilities).length).toBe(0)
  })

  it('anytime_scorer.confidence is "low"', () => {
    expect(anytimeScorer.confidence).toBe('low')
  })

  it('first_scorer.confidence is "low"', () => {
    expect(firstScorer.confidence).toBe('low')
  })

  it('anytime_scorer.market is "anytime_scorer"', () => {
    expect(anytimeScorer.market).toBe('anytime_scorer')
  })

  it('first_scorer.market is "first_scorer"', () => {
    expect(firstScorer.market).toBe('first_scorer')
  })
})

// ---------------------------------------------------------------------------
// Test 6 (bonus): eligibleInputs — players with goalsPerMinute=0 are excluded
// ---------------------------------------------------------------------------

describe('buildScorerOutputs — goalsPerMinute=0 excludes players before calculation', () => {
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

  it('anytime_scorer: player with goalsPerMinute=0 does not appear', () => {
    expect(anytimeScorer.probabilities).not.toHaveProperty('70_Player70')
  })

  it('anytime_scorer: active player DOES appear', () => {
    expect(anytimeScorer.probabilities).toHaveProperty('80_Player80')
  })

  it('first_scorer: sum ≈ 1.0 (±0.001)', () => {
    const total = sumProbs(firstScorer.probabilities)
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.001)
  })
})
