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

// Equipo fuerte: 2.0 goles a favor, 0.7 en contra
const strongTeam = makeTeam({ id: 1, name: 'Strong', avgGoalsScored: 2.0, avgGoalsConceded: 0.7 })
// Equipo medio: igual a la media hipotetica
const avgTeam = makeTeam({ id: 2, name: 'Average', avgGoalsScored: 1.35, avgGoalsConceded: 1.35 })
// Equipo debil: 0.7 goles a favor, 2.0 en contra
const weakTeam = makeTeam({ id: 3, name: 'Weak', avgGoalsScored: 0.7, avgGoalsConceded: 2.0 })

const sampleTeams = [strongTeam, avgTeam, weakTeam]

describe('computeStrengths - pureza funcional', () => {
  it('no muta el array de entrada', () => {
    const original = sampleTeams.map(t => ({ ...t }))
    computeStrengths(sampleTeams)
    for (let i = 0; i < sampleTeams.length; i++) {
      expect(sampleTeams[i].attackStrength).toBe(original[i].attackStrength)
      expect(sampleTeams[i].defenseStrength).toBe(original[i].defenseStrength)
    }
  })

  it('no muta los objetos originales (los ids se conservan)', () => {
    const input = sampleTeams.map(t => ({ ...t }))
    const result = computeStrengths(input)
    for (let i = 0; i < result.length; i++) {
      expect(result[i].id).toBe(input[i].id)
      expect(result[i].name).toBe(input[i].name)
    }
  })

  it('devuelve el mismo numero de equipos que recibe', () => {
    const result = computeStrengths(sampleTeams)
    expect(result).toHaveLength(sampleTeams.length)
  })
})

describe('computeStrengths - ordenacion por fuerza', () => {
  it('equipo con mayor avgGoalsScored tiene mayor attackStrength', () => {
    const result = computeStrengths(sampleTeams)
    const strong = result.find(t => t.id === 1)!
    const weak = result.find(t => t.id === 3)!
    expect(strong.attackStrength).toBeGreaterThan(weak.attackStrength)
  })

  it('equipo con mayor avgGoalsConceded tiene mayor defenseStrength (peor defensa)', () => {
    const result = computeStrengths(sampleTeams)
    const strong = result.find(t => t.id === 1)! // concede 0.7 (buena defensa)
    const weak = result.find(t => t.id === 3)!   // concede 2.0 (mala defensa)
    expect(weak.defenseStrength).toBeGreaterThan(strong.defenseStrength)
  })

  it('equipo con avgGoalsScored igual a la media tiene attackStrength ~1.0', () => {
    // Si el equipo promedio tiene exactamente la media, su ratio es 1.0
    // La media de [2.0, 1.35, 0.7] = 4.05/3 = 1.35
    const result = computeStrengths(sampleTeams)
    const avg = result.find(t => t.id === 2)!
    expect(avg.attackStrength).toBeCloseTo(1.0, 5)
  })
})

describe('computeStrengths - valores dentro de [STRENGTH_MIN, STRENGTH_MAX]', () => {
  it('attackStrength de todos los equipos esta en [STRENGTH_MIN, STRENGTH_MAX]', () => {
    const result = computeStrengths(sampleTeams)
    for (const team of result) {
      expect(team.attackStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
      expect(team.attackStrength).toBeLessThanOrEqual(STRENGTH_MAX)
    }
  })

  it('defenseStrength de todos los equipos esta en [STRENGTH_MIN, STRENGTH_MAX]', () => {
    const result = computeStrengths(sampleTeams)
    for (const team of result) {
      expect(team.defenseStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
      expect(team.defenseStrength).toBeLessThanOrEqual(STRENGTH_MAX)
    }
  })

  it('un equipo extremadamente fuerte queda clamped a STRENGTH_MAX', () => {
    const extremeTeam = makeTeam({ id: 99, name: 'Extreme', avgGoalsScored: 100.0, avgGoalsConceded: 0.1 })
    const result = computeStrengths([strongTeam, weakTeam, extremeTeam])
    const extreme = result.find(t => t.id === 99)!
    expect(extreme.attackStrength).toBeLessThanOrEqual(STRENGTH_MAX)
  })

  it('un equipo extremadamente debil queda clamped a STRENGTH_MIN', () => {
    const extremeWeak = makeTeam({ id: 98, name: 'Terrible', avgGoalsScored: 0.01, avgGoalsConceded: 100.0 })
    const result = computeStrengths([strongTeam, weakTeam, extremeWeak])
    const weak = result.find(t => t.id === 98)!
    expect(weak.attackStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
  })
})

describe('computeStrengths - edge cases con null', () => {
  it('equipo con avgGoalsScored null recibe attackStrength = 1.0', () => {
    const teamWithNull = makeTeam({ id: 10, name: 'NullScored', avgGoalsScored: null, avgGoalsConceded: 1.2 })
    const result = computeStrengths([strongTeam, weakTeam, teamWithNull])
    const nullTeam = result.find(t => t.id === 10)!
    expect(nullTeam.attackStrength).toBe(1.0)
  })

  it('equipo con avgGoalsConceded null recibe defenseStrength = 1.0', () => {
    const teamWithNull = makeTeam({ id: 11, name: 'NullConceded', avgGoalsScored: 1.5, avgGoalsConceded: null })
    const result = computeStrengths([strongTeam, weakTeam, teamWithNull])
    const nullTeam = result.find(t => t.id === 11)!
    expect(nullTeam.defenseStrength).toBe(1.0)
  })

  it('si todos los equipos tienen avgGoalsScored null, devuelve el array sin cambios en attackStrength', () => {
    const allNull = [
      makeTeam({ id: 20, avgGoalsScored: null, avgGoalsConceded: null }),
      makeTeam({ id: 21, avgGoalsScored: null, avgGoalsConceded: null }),
    ]
    const result = computeStrengths(allNull)
    // No hay valores validos -> la funcion retorna el array tal cual
    expect(result).toHaveLength(2)
    expect(result[0].attackStrength).toBe(1.0)
    expect(result[1].attackStrength).toBe(1.0)
  })

  it('array vacio devuelve array vacio', () => {
    const result = computeStrengths([])
    expect(result).toHaveLength(0)
  })

  it('un solo equipo recibe attackStrength = 1.0 (ratio contra si mismo)', () => {
    const single = makeTeam({ id: 30, avgGoalsScored: 2.5, avgGoalsConceded: 0.8 })
    const result = computeStrengths([single])
    // media de [2.5] = 2.5; ratio = 2.5/2.5 = 1.0
    expect(result[0].attackStrength).toBeCloseTo(1.0, 5)
    expect(result[0].defenseStrength).toBeCloseTo(1.0, 5)
  })
})

describe('computeStrengths - calculo numerico correcto', () => {
  it('attackStrength es avgGoalsScored / mean(avgGoalsScored) para todos los equipos con datos', () => {
    // media de [2.0, 1.35, 0.7] = 4.05 / 3 = 1.35
    const meanScored = (2.0 + 1.35 + 0.7) / 3
    const result = computeStrengths(sampleTeams)

    const strong = result.find(t => t.id === 1)!
    const avg = result.find(t => t.id === 2)!
    const weak = result.find(t => t.id === 3)!

    expect(strong.attackStrength).toBeCloseTo(2.0 / meanScored, 5)
    expect(avg.attackStrength).toBeCloseTo(1.35 / meanScored, 5)
    expect(weak.attackStrength).toBeCloseTo(0.7 / meanScored, 5)
  })

  it('defenseStrength es avgGoalsConceded / mean(avgGoalsConceded)', () => {
    // media de [0.7, 1.35, 2.0] = 4.05 / 3 = 1.35
    const meanConceded = (0.7 + 1.35 + 2.0) / 3
    const result = computeStrengths(sampleTeams)

    const strong = result.find(t => t.id === 1)!  // concede 0.7
    const avg = result.find(t => t.id === 2)!     // concede 1.35
    const weak = result.find(t => t.id === 3)!    // concede 2.0

    expect(strong.defenseStrength).toBeCloseTo(0.7 / meanConceded, 5)
    expect(avg.defenseStrength).toBeCloseTo(1.35 / meanConceded, 5)
    expect(weak.defenseStrength).toBeCloseTo(2.0 / meanConceded, 5)
  })
})
