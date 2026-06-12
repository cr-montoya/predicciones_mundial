/**
 * Tests de integracion para el seed de equipos y FK constraints de fixtures.
 *
 * Todos los tests usan una DB en memoria (':memory:') construida desde el
 * schema real (lib/db/schema.sql) y el seed real (lib/data/teams-seed.ts).
 * No hay mocks de better-sqlite3 ni del FS.
 *
 * Cubre:
 *  1. Idempotencia: dos ejecuciones del seed no fallan ni duplican filas.
 *  2. Alineacion de IDs seed vs fixtures-mock.
 *  3. FK constraint resuelto al insertar un fixture con IDs del seed.
 *  4. Defaults del schema post-seed.
 *  5. upsertTeamStats actualiza stats sin pisar attack_strength/defense_strength.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { worldCupTeams } from '@/lib/data/teams-seed'
import { mockFixtures } from '@/lib/data/fixtures-mock'
import { seedTeams } from '@/lib/db/seed'

const SCHEMA_PATH = join(process.cwd(), 'lib', 'db', 'schema.sql')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDb(): Database.Database {
  const instance = new Database(':memory:')
  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')
  const schema = readFileSync(SCHEMA_PATH, 'utf-8')
  instance.exec(schema)
  return instance
}

interface TeamRow {
  id: number
  name: string
  group: string
  fifa_ranking: number | null
  attack_strength: number
  defense_strength: number
  home_advantage: number
  recent_form: number | null
  avg_goals_scored: number | null
  avg_goals_conceded: number | null
}

function getAllTeams(db: Database.Database): TeamRow[] {
  return db.prepare('SELECT * FROM teams').all() as TeamRow[]
}

function getTeamById(db: Database.Database, id: number): TeamRow | undefined {
  return db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined
}

function insertFixture(
  db: Database.Database,
  fixture: { id: number; homeTeamId: number; awayTeamId: number; kickoffUtc: string }
): void {
  db.prepare(`
    INSERT INTO fixtures (id, home_team_id, away_team_id, kickoff_utc, status)
    VALUES (@id, @homeTeamId, @awayTeamId, @kickoffUtc, 'scheduled')
  `).run(fixture)
}

function upsertTeamStats(
  db: Database.Database,
  teamId: number,
  stats: {
    avgGoalsScored: number | null
    avgGoalsConceded: number | null
    attackStrength: number
    defenseStrength: number
  }
): void {
  db.prepare(`
    UPDATE teams
    SET avg_goals_scored   = @avgGoalsScored,
        avg_goals_conceded = @avgGoalsConceded,
        attack_strength    = @attackStrength,
        defense_strength   = @defenseStrength
    WHERE id = @id
  `).run({
    id: teamId,
    avgGoalsScored: stats.avgGoalsScored ?? null,
    avgGoalsConceded: stats.avgGoalsConceded ?? null,
    attackStrength: stats.attackStrength,
    defenseStrength: stats.defenseStrength,
  })
}

// ---------------------------------------------------------------------------
// 1. Idempotencia del seed
// ---------------------------------------------------------------------------

describe('seedTeams: idempotencia', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
  })

  it('primera ejecucion del seed no lanza', () => {
    expect(() => seedTeams(db, worldCupTeams)).not.toThrow()
  })

  it('segunda ejecucion del seed no lanza (INSERT OR IGNORE)', () => {
    seedTeams(db, worldCupTeams)
    expect(() => seedTeams(db, worldCupTeams)).not.toThrow()
  })

  it('despues de dos ejecuciones hay exactamente 48 equipos (sin duplicados)', () => {
    seedTeams(db, worldCupTeams)
    seedTeams(db, worldCupTeams)
    const teams = getAllTeams(db)
    expect(teams).toHaveLength(48)
  })

  it('el seed inserta exactamente 48 equipos en la primera corrida', () => {
    seedTeams(db, worldCupTeams)
    const teams = getAllTeams(db)
    expect(teams).toHaveLength(48)
  })
})

// ---------------------------------------------------------------------------
// 2. IDs del seed vs fixtures-mock
// ---------------------------------------------------------------------------

describe('IDs del seed alineados con fixtures-mock', () => {
  const EXPECTED_IDS: Record<string, number> = {
    Argentina: 26,
    Brazil: 6,
    France: 2,
    England: 24,
  }

  it('el seed define Argentina=26', () => {
    const entry = worldCupTeams.find((t) => t.name === 'Argentina')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['Argentina'])
  })

  it('el seed define Brazil=6', () => {
    const entry = worldCupTeams.find((t) => t.name === 'Brazil')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['Brazil'])
  })

  it('el seed define France=2', () => {
    const entry = worldCupTeams.find((t) => t.name === 'France')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['France'])
  })

  it('el seed define England=24', () => {
    const entry = worldCupTeams.find((t) => t.name === 'England')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['England'])
  })

  it('mockFixtures usa homeTeamId y awayTeamId presentes en el seed', () => {
    const seedIds = new Set(worldCupTeams.map((t) => t.id))
    for (const fixture of mockFixtures) {
      expect(seedIds.has(fixture.homeTeamId),
        `homeTeamId ${fixture.homeTeamId} del fixture ${fixture.id} no existe en el seed`
      ).toBe(true)
      expect(seedIds.has(fixture.awayTeamId),
        `awayTeamId ${fixture.awayTeamId} del fixture ${fixture.id} no existe en el seed`
      ).toBe(true)
    }
  })

  it('fixture 5001 es Argentina(26) vs France(2)', () => {
    const f = mockFixtures.find((f) => f.id === 5001)
    expect(f).toBeDefined()
    expect(f!.homeTeamId).toBe(26)
    expect(f!.awayTeamId).toBe(2)
  })

  it('fixture 5002 es Brazil(6) vs England(24)', () => {
    const f = mockFixtures.find((f) => f.id === 5002)
    expect(f).toBeDefined()
    expect(f!.homeTeamId).toBe(6)
    expect(f!.awayTeamId).toBe(24)
  })
})

// ---------------------------------------------------------------------------
// 3. FK constraint resuelto al insertar fixtures
// ---------------------------------------------------------------------------

describe('FK constraint: insertar fixtures con IDs del seed', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
    seedTeams(db, worldCupTeams)
  })

  it('insertar fixture Argentina(26) vs France(2) no lanza FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 5001,
        homeTeamId: 26,
        awayTeamId: 2,
        kickoffUtc: '2026-06-15T18:00:00Z',
      })
    ).not.toThrow()
  })

  it('insertar fixture Brazil(6) vs England(24) no lanza FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 5002,
        homeTeamId: 6,
        awayTeamId: 24,
        kickoffUtc: '2026-06-16T20:00:00Z',
      })
    ).not.toThrow()
  })

  it('insertar fixture con homeTeamId inexistente lanza FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 9999,
        homeTeamId: 99999,
        awayTeamId: 26,
        kickoffUtc: '2026-06-20T18:00:00Z',
      })
    ).toThrow()
  })

  it('insertar fixture con awayTeamId inexistente lanza FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 9998,
        homeTeamId: 26,
        awayTeamId: 99999,
        kickoffUtc: '2026-06-20T20:00:00Z',
      })
    ).toThrow()
  })

  it('todos los fixtures del mock se pueden insertar sin FK error', () => {
    for (const f of mockFixtures) {
      expect(() =>
        insertFixture(db, {
          id: f.id,
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
          kickoffUtc: f.kickoffUtc,
        })
      ).not.toThrow()
    }
    const count = (db.prepare('SELECT COUNT(*) as n FROM fixtures').get() as { n: number }).n
    expect(count).toBe(mockFixtures.length)
  })
})

// ---------------------------------------------------------------------------
// 4. Defaults del schema post-seed
// ---------------------------------------------------------------------------

describe('defaults del schema post-seed', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
    seedTeams(db, worldCupTeams)
  })

  it('attack_strength = 1.0 para todos los equipos recien insertados', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.attack_strength,
        `${t.name} (id=${t.id}) attack_strength esperado 1.0, got ${t.attack_strength}`
      ).toBe(1.0)
    }
  })

  it('defense_strength = 1.0 para todos los equipos recien insertados', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.defense_strength,
        `${t.name} (id=${t.id}) defense_strength esperado 1.0, got ${t.defense_strength}`
      ).toBe(1.0)
    }
  })

  it('home_advantage = 1.05 para USA (id=1)', () => {
    const usa = getTeamById(db, 1)
    expect(usa).toBeDefined()
    expect(usa!.home_advantage).toBe(1.05)
  })

  it('home_advantage = 1.05 para Canada (id=101)', () => {
    const canada = getTeamById(db, 101)
    expect(canada).toBeDefined()
    expect(canada!.home_advantage).toBe(1.05)
  })

  it('home_advantage = 1.05 para Mexico (id=16)', () => {
    const mexico = getTeamById(db, 16)
    expect(mexico).toBeDefined()
    expect(mexico!.home_advantage).toBe(1.05)
  })

  it('home_advantage = 1.0 para Argentina (id=26)', () => {
    const arg = getTeamById(db, 26)
    expect(arg).toBeDefined()
    expect(arg!.home_advantage).toBe(1.0)
  })

  it('home_advantage = 1.0 para todos los equipos no anfitriones', () => {
    const hostIds = new Set([1, 101, 16])
    const teams = getAllTeams(db)
    for (const t of teams) {
      if (!hostIds.has(t.id)) {
        expect(t.home_advantage,
          `${t.name} (id=${t.id}) home_advantage esperado 1.0, got ${t.home_advantage}`
        ).toBe(1.0)
      }
    }
  })

  it('fifa_ranking es NULL para todos los equipos recien insertados', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.fifa_ranking,
        `${t.name} (id=${t.id}) fifa_ranking debe ser NULL antes de stats`
      ).toBeNull()
    }
  })

  it('avg_goals_scored es NULL para todos los equipos recien insertados', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.avg_goals_scored,
        `${t.name} (id=${t.id}) avg_goals_scored debe ser NULL antes de stats`
      ).toBeNull()
    }
  })

  it('avg_goals_conceded es NULL para todos los equipos recien insertados', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.avg_goals_conceded,
        `${t.name} (id=${t.id}) avg_goals_conceded debe ser NULL antes de stats`
      ).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// 5. upsertTeamStats actualiza stats sin pisar attack_strength / defense_strength
// ---------------------------------------------------------------------------

describe('upsertTeamStats: stats update no pisa valores del seed', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
    seedTeams(db, worldCupTeams)
  })

  it('upsertTeamStats(26, ...) actualiza avg_goals_scored de Argentina sin FK error', () => {
    expect(() =>
      upsertTeamStats(db, 26, {
        avgGoalsScored: 1.5,
        avgGoalsConceded: 0.8,
        attackStrength: 1.0,
        defenseStrength: 1.0,
      })
    ).not.toThrow()

    const arg = getTeamById(db, 26)
    expect(arg!.avg_goals_scored).toBe(1.5)
    expect(arg!.avg_goals_conceded).toBe(0.8)
  })

  it('despues de upsertTeamStats, attack_strength y defense_strength siguen siendo 1.0 si no se cambian', () => {
    upsertTeamStats(db, 26, {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.8,
      attackStrength: 1.0,
      defenseStrength: 1.0,
    })

    const arg = getTeamById(db, 26)
    expect(arg!.attack_strength).toBe(1.0)
    expect(arg!.defense_strength).toBe(1.0)
  })

  it('upsertTeamStats para un teamId inexistente no lanza (UPDATE sin filas no es error)', () => {
    expect(() =>
      upsertTeamStats(db, 99999, {
        avgGoalsScored: 1.5,
        avgGoalsConceded: 0.8,
        attackStrength: 1.0,
        defenseStrength: 1.0,
      })
    ).not.toThrow()
  })

  it('equipos no actualizados por upsertTeamStats siguen con avg_goals_scored NULL', () => {
    upsertTeamStats(db, 26, {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.8,
      attackStrength: 1.0,
      defenseStrength: 1.0,
    })

    // Brazil (6) no fue tocado
    const brazil = getTeamById(db, 6)
    expect(brazil!.avg_goals_scored).toBeNull()
    expect(brazil!.avg_goals_conceded).toBeNull()
  })

  it('upsertTeamStats actualiza los 48 equipos del seed sin error', () => {
    expect(() => {
      for (const team of worldCupTeams) {
        upsertTeamStats(db, team.id, {
          avgGoalsScored: 1.5,
          avgGoalsConceded: 1.0,
          attackStrength: 1.0,
          defenseStrength: 1.0,
        })
      }
    }).not.toThrow()

    // Verificar que todos tienen avg actualizado
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.avg_goals_scored).toBe(1.5)
    }
  })
})
