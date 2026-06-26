import { describe, it, expect } from 'vitest'
import type { Team } from '@/lib/types'
import { computeStrengths } from '@/lib/agents/strength-batch'
import { STRENGTH_MIN, STRENGTH_MAX } from '@/lib/model/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTeam(overrides: Partial<Team> & { id: number }): Team {
  return {
    id: overrides.id,
    name: overrides.name ?? `Team${overrides.id}`,
    group: overrides.group ?? 'A',
    fifaRanking: null,
    attackStrength: 1.0,
    defenseStrength: 1.0,
    homeAdvantage: 1.0,
    recentForm: null,
    avgGoalsScored: overrides.avgGoalsScored ?? null,
    avgGoalsConceded: overrides.avgGoalsConceded ?? null,
  }
}

// Strong team: 2.0 goals scored, 0.7 conceded
const strongTeam = makeTeam({ id: 1, name: 'Strong', avgGoalsScored: 2.0, avgGoalsConceded: 0.7 })
// Average team: exactly at the hypothetical mean
const avgTeam = makeTeam({ id: 2, name: 'Average', avgGoalsScored: 1.35, avgGoalsConceded: 1.35 })
// Weak team: 0.7 goals scored, 2.0 conceded
const weakTeam = makeTeam({ id: 3, name: 'Weak', avgGoalsScored: 0.7, avgGoalsConceded: 2.0 })

const sampleTeams = [strongTeam, avgTeam, weakTeam]

describe('computeStrengths - functional purity', () => {
  it('does not mutate the input array', () => {
    const original = sampleTeams.map(t => ({ ...t }))
    computeStrengths(sampleTeams)
    for (let i = 0; i < sampleTeams.length; i++) {
      expect(sampleTeams[i].attackStrength).toBe(original[i].attackStrength)
      expect(sampleTeams[i].defenseStrength).toBe(original[i].defenseStrength)
    }
  })

  it('does not mutate original objects (ids are preserved)', () => {
    const input = sampleTeams.map(t => ({ ...t }))
    const result = computeStrengths(input)
    for (let i = 0; i < result.length; i++) {
      expect(result[i].id).toBe(input[i].id)
      expect(result[i].name).toBe(input[i].name)
    }
  })

  it('returns the same number of teams as received', () => {
    const result = computeStrengths(sampleTeams)
    expect(result).toHaveLength(sampleTeams.length)
  })
})

describe('computeStrengths - strength ordering', () => {
  it('team with higher avgGoalsScored has higher attackStrength', () => {
    const result = computeStrengths(sampleTeams)
    const strong = result.find(t => t.id === 1)!
    const weak = result.find(t => t.id === 3)!
    expect(strong.attackStrength).toBeGreaterThan(weak.attackStrength)
  })

  it('team with higher avgGoalsConceded has higher defenseStrength (worse defense)', () => {
    const result = computeStrengths(sampleTeams)
    const strong = result.find(t => t.id === 1)! // concedes 0.7 (good defense)
    const weak = result.find(t => t.id === 3)!   // concedes 2.0 (bad defense)
    expect(weak.defenseStrength).toBeGreaterThan(strong.defenseStrength)
  })

  it('team with avgGoalsScored equal to the mean has attackStrength ~1.0', () => {
    // If the average team is exactly at the mean, its ratio is 1.0
    // Mean of [2.0, 1.35, 0.7] = 4.05/3 = 1.35
    const result = computeStrengths(sampleTeams)
    const avg = result.find(t => t.id === 2)!
    expect(avg.attackStrength).toBeCloseTo(1.0, 5)
  })
})

describe('computeStrengths - values within [STRENGTH_MIN, STRENGTH_MAX]', () => {
  it('attackStrength for all teams is in [STRENGTH_MIN, STRENGTH_MAX]', () => {
    const result = computeStrengths(sampleTeams)
    for (const team of result) {
      expect(team.attackStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
      expect(team.attackStrength).toBeLessThanOrEqual(STRENGTH_MAX)
    }
  })

  it('defenseStrength for all teams is in [STRENGTH_MIN, STRENGTH_MAX]', () => {
    const result = computeStrengths(sampleTeams)
    for (const team of result) {
      expect(team.defenseStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
      expect(team.defenseStrength).toBeLessThanOrEqual(STRENGTH_MAX)
    }
  })

  it('an extremely strong team is clamped to STRENGTH_MAX', () => {
    const extremeTeam = makeTeam({ id: 99, name: 'Extreme', avgGoalsScored: 100.0, avgGoalsConceded: 0.1 })
    const result = computeStrengths([strongTeam, weakTeam, extremeTeam])
    const extreme = result.find(t => t.id === 99)!
    expect(extreme.attackStrength).toBeLessThanOrEqual(STRENGTH_MAX)
  })

  it('an extremely weak team is clamped to STRENGTH_MIN', () => {
    const extremeWeak = makeTeam({ id: 98, name: 'Terrible', avgGoalsScored: 0.01, avgGoalsConceded: 100.0 })
    const result = computeStrengths([strongTeam, weakTeam, extremeWeak])
    const weak = result.find(t => t.id === 98)!
    expect(weak.attackStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
  })
})

describe('computeStrengths - edge cases with null', () => {
  it('team with avgGoalsScored null receives attackStrength = 1.0', () => {
    const teamWithNull = makeTeam({ id: 10, name: 'NullScored', avgGoalsScored: null, avgGoalsConceded: 1.2 })
    const result = computeStrengths([strongTeam, weakTeam, teamWithNull])
    const nullTeam = result.find(t => t.id === 10)!
    expect(nullTeam.attackStrength).toBe(1.0)
  })

  it('team with avgGoalsConceded null receives defenseStrength = 1.0', () => {
    const teamWithNull = makeTeam({ id: 11, name: 'NullConceded', avgGoalsScored: 1.5, avgGoalsConceded: null })
    const result = computeStrengths([strongTeam, weakTeam, teamWithNull])
    const nullTeam = result.find(t => t.id === 11)!
    expect(nullTeam.defenseStrength).toBe(1.0)
  })

  it('if all teams have avgGoalsScored null, returns array unchanged in attackStrength', () => {
    const allNull = [
      makeTeam({ id: 20, avgGoalsScored: null, avgGoalsConceded: null }),
      makeTeam({ id: 21, avgGoalsScored: null, avgGoalsConceded: null }),
    ]
    const result = computeStrengths(allNull)
    // No valid values — function returns the array as-is
    expect(result).toHaveLength(2)
    expect(result[0].attackStrength).toBe(1.0)
    expect(result[1].attackStrength).toBe(1.0)
  })

  it('empty array returns empty array', () => {
    const result = computeStrengths([])
    expect(result).toHaveLength(0)
  })

  it('single team receives attackStrength = 1.0 (ratio against itself)', () => {
    const single = makeTeam({ id: 30, avgGoalsScored: 2.5, avgGoalsConceded: 0.8 })
    const result = computeStrengths([single])
    // mean of [2.5] = 2.5; ratio = 2.5/2.5 = 1.0
    expect(result[0].attackStrength).toBeCloseTo(1.0, 5)
    expect(result[0].defenseStrength).toBeCloseTo(1.0, 5)
  })
})

describe('computeStrengths - correct numerical calculation', () => {
  it('attackStrength is avgGoalsScored / mean(avgGoalsScored) for all teams with data', () => {
    // mean of [2.0, 1.35, 0.7] = 4.05 / 3 = 1.35
    const meanScored = (2.0 + 1.35 + 0.7) / 3
    const result = computeStrengths(sampleTeams)

    const strong = result.find(t => t.id === 1)!
    const avg = result.find(t => t.id === 2)!
    const weak = result.find(t => t.id === 3)!

    expect(strong.attackStrength).toBeCloseTo(2.0 / meanScored, 5)
    expect(avg.attackStrength).toBeCloseTo(1.35 / meanScored, 5)
    expect(weak.attackStrength).toBeCloseTo(0.7 / meanScored, 5)
  })

  it('defenseStrength is avgGoalsConceded / mean(avgGoalsConceded)', () => {
    // mean of [0.7, 1.35, 2.0] = 4.05 / 3 = 1.35
    const meanConceded = (0.7 + 1.35 + 2.0) / 3
    const result = computeStrengths(sampleTeams)

    const strong = result.find(t => t.id === 1)!  // concedes 0.7
    const avg = result.find(t => t.id === 2)!     // concedes 1.35
    const weak = result.find(t => t.id === 3)!    // concedes 2.0

    expect(strong.defenseStrength).toBeCloseTo(0.7 / meanConceded, 5)
    expect(avg.defenseStrength).toBeCloseTo(1.35 / meanConceded, 5)
    expect(weak.defenseStrength).toBeCloseTo(2.0 / meanConceded, 5)
  })
})
