import { describe, it, expect } from 'vitest'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { STRENGTH_MIN, STRENGTH_MAX } from '@/lib/model/constants'

describe('buildStaticTeams - estructura basica', () => {
  const teams = buildStaticTeams()

  it('devuelve exactamente 48 equipos', () => {
    expect(teams).toHaveLength(48)
  })

  it('todos los ids son numeros positivos unicos', () => {
    const ids = teams.map(t => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(48)
    for (const id of ids) {
      expect(id).toBeGreaterThan(0)
    }
  })

  it('todos los nombres son cadenas no vacias', () => {
    for (const team of teams) {
      expect(typeof team.name).toBe('string')
      expect(team.name.length).toBeGreaterThan(0)
    }
  })

  it('todos los equipos tienen grupo asignado (A..L)', () => {
    const validGroups = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
    for (const team of teams) {
      expect(validGroups.has(team.group)).toBe(true)
    }
  })

  it('12 grupos distintos, 4 equipos por grupo', () => {
    const countByGroup = new Map<string, number>()
    for (const team of teams) {
      countByGroup.set(team.group, (countByGroup.get(team.group) ?? 0) + 1)
    }
    expect(countByGroup.size).toBe(12)
    for (const [, count] of countByGroup) {
      expect(count).toBe(4)
    }
  })
})

describe('buildStaticTeams - fuerzas de los favoritos', () => {
  const teams = buildStaticTeams()

  it('France (id=2) tiene attackStrength > 1.0', () => {
    const france = teams.find(t => t.id === 2)
    expect(france).toBeDefined()
    expect(france!.attackStrength).toBeGreaterThan(1.0)
  })

  it('Spain (id=9) tiene attackStrength > 1.0', () => {
    const spain = teams.find(t => t.id === 9)
    expect(spain).toBeDefined()
    expect(spain!.attackStrength).toBeGreaterThan(1.0)
  })

  it('Brazil (id=6) tiene attackStrength > 1.0', () => {
    const brazil = teams.find(t => t.id === 6)
    expect(brazil).toBeDefined()
    expect(brazil!.attackStrength).toBeGreaterThan(1.0)
  })

  it('Argentina (id=26) tiene attackStrength > 1.0', () => {
    const arg = teams.find(t => t.id === 26)
    expect(arg).toBeDefined()
    expect(arg!.attackStrength).toBeGreaterThan(1.0)
  })

  it('Haiti (id=168) tiene attackStrength < 1.0 (equipo debil)', () => {
    const haiti = teams.find(t => t.id === 168)
    expect(haiti).toBeDefined()
    expect(haiti!.attackStrength).toBeLessThan(1.0)
  })

  it('Panama (id=22) tiene attackStrength < 1.0 (equipo debil)', () => {
    const panama = teams.find(t => t.id === 22)
    expect(panama).toBeDefined()
    expect(panama!.attackStrength).toBeLessThan(1.0)
  })

  it('Saudi Arabia (id=34) tiene attackStrength < 1.0 (equipo debil)', () => {
    const saudi = teams.find(t => t.id === 34)
    expect(saudi).toBeDefined()
    expect(saudi!.attackStrength).toBeLessThan(1.0)
  })

  it('France tiene mayor attackStrength que Haiti', () => {
    const france = teams.find(t => t.id === 2)!
    const haiti = teams.find(t => t.id === 168)!
    expect(france.attackStrength).toBeGreaterThan(haiti.attackStrength)
  })

  it('Spain tiene mayor attackStrength que Panama', () => {
    const spain = teams.find(t => t.id === 9)!
    const panama = teams.find(t => t.id === 22)!
    expect(spain.attackStrength).toBeGreaterThan(panama.attackStrength)
  })

  it('France y Brazil tienen mejor defensa que Qatar (defenseStrength menor)', () => {
    const france = teams.find(t => t.id === 2)!
    const brazil = teams.find(t => t.id === 6)!
    const qatar = teams.find(t => t.id === 197)!
    expect(france.defenseStrength).toBeLessThan(qatar.defenseStrength)
    expect(brazil.defenseStrength).toBeLessThan(qatar.defenseStrength)
  })
})

describe('buildStaticTeams - acotamiento de fuerzas', () => {
  const teams = buildStaticTeams()

  it('attackStrength de todos los equipos esta en [STRENGTH_MIN, STRENGTH_MAX]', () => {
    for (const team of teams) {
      expect(team.attackStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
      expect(team.attackStrength).toBeLessThanOrEqual(STRENGTH_MAX)
    }
  })

  it('defenseStrength de todos los equipos esta en [STRENGTH_MIN, STRENGTH_MAX]', () => {
    for (const team of teams) {
      expect(team.defenseStrength).toBeGreaterThanOrEqual(STRENGTH_MIN)
      expect(team.defenseStrength).toBeLessThanOrEqual(STRENGTH_MAX)
    }
  })
})

describe('buildStaticTeams - anfitriones tienen homeAdvantage > 1.0', () => {
  const teams = buildStaticTeams()

  it('USA (id=1) tiene homeAdvantage 1.05', () => {
    const usa = teams.find(t => t.id === 1)
    expect(usa).toBeDefined()
    expect(usa!.homeAdvantage).toBe(1.05)
  })

  it('Canada (id=101) tiene homeAdvantage 1.05', () => {
    const canada = teams.find(t => t.id === 101)
    expect(canada).toBeDefined()
    expect(canada!.homeAdvantage).toBe(1.05)
  })

  it('Mexico (id=16) tiene homeAdvantage 1.05', () => {
    const mexico = teams.find(t => t.id === 16)
    expect(mexico).toBeDefined()
    expect(mexico!.homeAdvantage).toBe(1.05)
  })

  it('el resto de equipos tiene homeAdvantage = 1.0', () => {
    const hosts = new Set([1, 101, 16])
    for (const team of teams) {
      if (!hosts.has(team.id)) {
        expect(team.homeAdvantage).toBe(1.0)
      }
    }
  })
})

describe('buildStaticTeams - idempotencia', () => {
  it('dos llamadas consecutivas producen el mismo resultado', () => {
    const result1 = buildStaticTeams()
    const result2 = buildStaticTeams()
    expect(result1).toHaveLength(result2.length)
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].id).toBe(result2[i].id)
      expect(result1[i].attackStrength).toBeCloseTo(result2[i].attackStrength, 10)
      expect(result1[i].defenseStrength).toBeCloseTo(result2[i].defenseStrength, 10)
    }
  })
})
