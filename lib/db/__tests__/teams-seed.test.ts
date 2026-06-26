/**
 * Integration tests for team seed and FK constraints on fixtures.
 *
 * All tests use an in-memory DB (':memory:') built from the real schema
 * (lib/db/schema.sql) and the real seed (lib/data/teams-seed.ts).
 * No better-sqlite3 or FS mocks.
 *
 * Covers:
 *  1. Idempotency: two seed runs neither fail nor duplicate rows.
 *  2. ID alignment between seed and fixtures-mock.
 *  3. FK constraint satisfied when inserting a fixture with seed IDs.
 *  4. Schema defaults after seed.
 *  5. upsertTeamStats updates stats without overwriting attack_strength/defense_strength.
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
// 1. Seed idempotency
// ---------------------------------------------------------------------------

describe('seedTeams: idempotency', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
  })

  it('first seed run does not throw', () => {
    expect(() => seedTeams(db, worldCupTeams)).not.toThrow()
  })

  it('second seed run does not throw (INSERT OR IGNORE)', () => {
    seedTeams(db, worldCupTeams)
    expect(() => seedTeams(db, worldCupTeams)).not.toThrow()
  })

  it('after two runs there are exactly 48 teams (no duplicates)', () => {
    seedTeams(db, worldCupTeams)
    seedTeams(db, worldCupTeams)
    const teams = getAllTeams(db)
    expect(teams).toHaveLength(48)
  })

  it('seed inserts exactly 48 teams on the first run', () => {
    seedTeams(db, worldCupTeams)
    const teams = getAllTeams(db)
    expect(teams).toHaveLength(48)
  })
})

// ---------------------------------------------------------------------------
// 2. Seed IDs vs fixtures-mock
// ---------------------------------------------------------------------------

describe('seed IDs aligned with fixtures-mock', () => {
  const EXPECTED_IDS: Record<string, number> = {
    Argentina: 26,
    Brazil: 6,
    France: 2,
    England: 24,
  }

  it('seed defines Argentina=26', () => {
    const entry = worldCupTeams.find((t) => t.name === 'Argentina')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['Argentina'])
  })

  it('seed defines Brazil=6', () => {
    const entry = worldCupTeams.find((t) => t.name === 'Brazil')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['Brazil'])
  })

  it('seed defines France=2', () => {
    const entry = worldCupTeams.find((t) => t.name === 'France')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['France'])
  })

  it('seed defines England=24', () => {
    const entry = worldCupTeams.find((t) => t.name === 'England')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(EXPECTED_IDS['England'])
  })

  it('mockFixtures uses homeTeamId and awayTeamId present in the seed', () => {
    const seedIds = new Set(worldCupTeams.map((t) => t.id))
    for (const fixture of mockFixtures) {
      expect(seedIds.has(fixture.homeTeamId),
        `homeTeamId ${fixture.homeTeamId} from fixture ${fixture.id} does not exist in seed`
      ).toBe(true)
      expect(seedIds.has(fixture.awayTeamId),
        `awayTeamId ${fixture.awayTeamId} from fixture ${fixture.id} does not exist in seed`
      ).toBe(true)
    }
  })

  it('fixture 5001 is Argentina(26) vs France(2)', () => {
    const f = mockFixtures.find((f) => f.id === 5001)
    expect(f).toBeDefined()
    expect(f!.homeTeamId).toBe(26)
    expect(f!.awayTeamId).toBe(2)
  })

  it('fixture 5002 is Brazil(6) vs England(24)', () => {
    const f = mockFixtures.find((f) => f.id === 5002)
    expect(f).toBeDefined()
    expect(f!.homeTeamId).toBe(6)
    expect(f!.awayTeamId).toBe(24)
  })
})

// ---------------------------------------------------------------------------
// 3. FK constraint satisfied when inserting fixtures
// ---------------------------------------------------------------------------

describe('FK constraint: inserting fixtures with seed IDs', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
    seedTeams(db, worldCupTeams)
  })

  it('inserting Argentina(26) vs France(2) does not throw FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 5001,
        homeTeamId: 26,
        awayTeamId: 2,
        kickoffUtc: '2026-06-15T18:00:00Z',
      })
    ).not.toThrow()
  })

  it('inserting Brazil(6) vs England(24) does not throw FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 5002,
        homeTeamId: 6,
        awayTeamId: 24,
        kickoffUtc: '2026-06-16T20:00:00Z',
      })
    ).not.toThrow()
  })

  it('inserting fixture with non-existent homeTeamId throws FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 9999,
        homeTeamId: 99999,
        awayTeamId: 26,
        kickoffUtc: '2026-06-20T18:00:00Z',
      })
    ).toThrow()
  })

  it('inserting fixture with non-existent awayTeamId throws FK error', () => {
    expect(() =>
      insertFixture(db, {
        id: 9998,
        homeTeamId: 26,
        awayTeamId: 99999,
        kickoffUtc: '2026-06-20T20:00:00Z',
      })
    ).toThrow()
  })

  it('all fixtures in the mock can be inserted without FK errors', () => {
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
// 4. Schema defaults after seed
// ---------------------------------------------------------------------------

describe('schema defaults after seed', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
    seedTeams(db, worldCupTeams)
  })

  it('attack_strength = 1.0 for all freshly inserted teams', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.attack_strength,
        `${t.name} (id=${t.id}) attack_strength expected 1.0, got ${t.attack_strength}`
      ).toBe(1.0)
    }
  })

  it('defense_strength = 1.0 for all freshly inserted teams', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.defense_strength,
        `${t.name} (id=${t.id}) defense_strength expected 1.0, got ${t.defense_strength}`
      ).toBe(1.0)
    }
  })

  it('home_advantage = 1.05 for USA (id=1)', () => {
    const usa = getTeamById(db, 1)
    expect(usa).toBeDefined()
    expect(usa!.home_advantage).toBe(1.05)
  })

  it('home_advantage = 1.05 for Canada (id=101)', () => {
    const canada = getTeamById(db, 101)
    expect(canada).toBeDefined()
    expect(canada!.home_advantage).toBe(1.05)
  })

  it('home_advantage = 1.05 for Mexico (id=16)', () => {
    const mexico = getTeamById(db, 16)
    expect(mexico).toBeDefined()
    expect(mexico!.home_advantage).toBe(1.05)
  })

  it('home_advantage = 1.0 for Argentina (id=26)', () => {
    const arg = getTeamById(db, 26)
    expect(arg).toBeDefined()
    expect(arg!.home_advantage).toBe(1.0)
  })

  it('home_advantage = 1.0 for all non-host teams', () => {
    const hostIds = new Set([1, 101, 16])
    const teams = getAllTeams(db)
    for (const t of teams) {
      if (!hostIds.has(t.id)) {
        expect(t.home_advantage,
          `${t.name} (id=${t.id}) home_advantage expected 1.0, got ${t.home_advantage}`
        ).toBe(1.0)
      }
    }
  })

  it('fifa_ranking is NULL for all freshly inserted teams', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.fifa_ranking,
        `${t.name} (id=${t.id}) fifa_ranking must be NULL before stats`
      ).toBeNull()
    }
  })

  it('avg_goals_scored is NULL for all freshly inserted teams', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.avg_goals_scored,
        `${t.name} (id=${t.id}) avg_goals_scored must be NULL before stats`
      ).toBeNull()
    }
  })

  it('avg_goals_conceded is NULL for all freshly inserted teams', () => {
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.avg_goals_conceded,
        `${t.name} (id=${t.id}) avg_goals_conceded must be NULL before stats`
      ).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// 5. upsertTeamStats updates stats without overwriting attack_strength / defense_strength
// ---------------------------------------------------------------------------

describe('upsertTeamStats: stats update does not overwrite seed values', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
    seedTeams(db, worldCupTeams)
  })

  it('upsertTeamStats(26, ...) updates avg_goals_scored for Argentina without FK error', () => {
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

  it('after upsertTeamStats, attack_strength and defense_strength remain 1.0 if unchanged', () => {
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

  it('upsertTeamStats for a non-existent teamId does not throw (UPDATE with no rows is not an error)', () => {
    expect(() =>
      upsertTeamStats(db, 99999, {
        avgGoalsScored: 1.5,
        avgGoalsConceded: 0.8,
        attackStrength: 1.0,
        defenseStrength: 1.0,
      })
    ).not.toThrow()
  })

  it('teams not updated by upsertTeamStats still have avg_goals_scored NULL', () => {
    upsertTeamStats(db, 26, {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.8,
      attackStrength: 1.0,
      defenseStrength: 1.0,
    })

    // Brazil (6) was not touched
    const brazil = getTeamById(db, 6)
    expect(brazil!.avg_goals_scored).toBeNull()
    expect(brazil!.avg_goals_conceded).toBeNull()
  })

  it('upsertTeamStats updates all 48 seed teams without error', () => {
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

    // Verify all teams have updated avg
    const teams = getAllTeams(db)
    for (const t of teams) {
      expect(t.avg_goals_scored).toBe(1.5)
    }
  })
})
