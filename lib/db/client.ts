type Database = any
import type { Team, Player, Fixture, FixtureStatus, MatchStats, MatchEvent, ModelOutput, RunLog, AgentName } from '@/lib/types'
import {
  mapTeam, mapPlayer, mapFixture, mapMatchStats, mapMatchEvent, mapPrediction, mapRunLog,
  type TeamRow, type PlayerRow, type FixtureRow, type MatchStatsRow,
  type MatchEventRow, type PredictionRow, type RunLogRow,
} from './mappers'
import { seedTeams } from './seed'
import { worldCupTeams } from '@/lib/data/teams-seed'

let DB_PATH: string
let SCHEMA_PATH: string

// Lazy imports: better-sqlite3 only in Node.js environments
function initPaths() {
  const { join } = require('path')
  DB_PATH = join(process.cwd(), 'data', 'mundial.db')
  SCHEMA_PATH = join(process.cwd(), 'lib', 'db', 'schema.sql')
}

function migrateRunLog(instance: Database): void {
  const row = instance
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'run_log'")
    .get() as { sql: string } | undefined

  if (!row || row.sql.includes("'running'")) return

  instance.exec(`
    ALTER TABLE run_log RENAME TO run_log_old;
    CREATE TABLE run_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name   TEXT    NOT NULL CHECK (agent_name IN ('cli_refresh', 'server_action')),
      started_at   TEXT    NOT NULL,
      finished_at  TEXT,
      duration_ms  INTEGER,
      status       TEXT    NOT NULL CHECK (status IN ('ok', 'error', 'running')),
      message      TEXT
    );
    INSERT INTO run_log SELECT * FROM run_log_old;
    DROP TABLE run_log_old;
  `)
}

let dbInstance: Database | null = null

function openDb(): Database {
  if (dbInstance) return dbInstance

  try {
    initPaths()
    const DatabaseConstructor = require('better-sqlite3')
    const { readFileSync } = require('fs')

    const instance = new DatabaseConstructor(DB_PATH)
    instance.pragma('journal_mode = WAL')
    instance.pragma('foreign_keys = ON')
    const schema = readFileSync(SCHEMA_PATH, 'utf-8')
    instance.exec(schema)
    migrateRunLog(instance)
    seedTeams(instance, worldCupTeams)

    dbInstance = instance
    return instance
  } catch (error) {
    throw new Error(
      `Failed to initialize database. better-sqlite3 is only available in Node.js environments. ` +
      `If you're on Cloudflare Pages, use D1 instead. Error: ${error}`
    )
  }
}

export function getDb(): Database {
  return openDb()
}

export function getTeams(): Team[] {
  const rows = getDb().prepare('SELECT * FROM teams').all() as TeamRow[]
  return rows.map(mapTeam)
}

export function getTeamById(id: number): Team | undefined {
  const row = getDb().prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined
  return row ? mapTeam(row) : undefined
}

export function getFixtures(status?: FixtureStatus): Fixture[] {
  const rows = status
    ? (getDb().prepare('SELECT * FROM fixtures WHERE status = ? ORDER BY kickoff_utc').all(status) as FixtureRow[])
    : (getDb().prepare('SELECT * FROM fixtures ORDER BY kickoff_utc').all() as FixtureRow[])
  return rows.map(mapFixture)
}

export function getFixtureById(id: number): Fixture | undefined {
  const row = getDb().prepare('SELECT * FROM fixtures WHERE id = ?').get(id) as FixtureRow | undefined
  return row ? mapFixture(row) : undefined
}

export function getPlayersByTeam(teamId: number): Player[] {
  const rows = getDb().prepare('SELECT * FROM players WHERE team_id = ?').all(teamId) as PlayerRow[]
  return rows.map(mapPlayer)
}

export function getMatchStats(fixtureId: number): MatchStats[] {
  const rows = getDb().prepare('SELECT * FROM match_stats WHERE fixture_id = ?').all(fixtureId) as MatchStatsRow[]
  return rows.map(mapMatchStats)
}

export function getMatchEvents(fixtureId: number): MatchEvent[] {
  const rows = getDb()
    .prepare('SELECT * FROM match_events WHERE fixture_id = ? ORDER BY minute')
    .all(fixtureId) as MatchEventRow[]
  return rows.map(mapMatchEvent)
}

export function getLatestPredictions(fixtureId: number): ModelOutput[] {
  const rows = getDb().prepare(`
    SELECT p.*
    FROM predictions p
    INNER JOIN (
      SELECT market, MAX(computed_at) AS max_at
      FROM predictions
      WHERE fixture_id = ?
      GROUP BY market
    ) latest ON p.market = latest.market AND p.computed_at = latest.max_at
    WHERE p.fixture_id = ?
  `).all(fixtureId, fixtureId) as PredictionRow[]
  return rows.map(mapPrediction)
}

export function getLatestTournamentPredictions(): ModelOutput[] {
  const rows = getDb().prepare(`
    SELECT p.*
    FROM predictions p
    INNER JOIN (
      SELECT market, MAX(computed_at) AS max_at
      FROM predictions
      WHERE fixture_id IS NULL
      GROUP BY market
    ) latest ON p.market = latest.market AND p.computed_at = latest.max_at
    WHERE p.fixture_id IS NULL
  `).all() as PredictionRow[]
  return rows.map(mapPrediction)
}

export function getLastRunLog(agentName: AgentName): RunLog | undefined {
  const row = getDb().prepare(`
    SELECT * FROM run_log
    WHERE agent_name = ?
    ORDER BY started_at DESC
    LIMIT 1
  `).get(agentName) as RunLogRow | undefined
  return row ? mapRunLog(row) : undefined
}

export function getLastOkRunLog(agentName: AgentName): RunLog | undefined {
  const row = getDb().prepare(`
    SELECT * FROM run_log
    WHERE agent_name = ? AND status = 'ok'
    ORDER BY started_at DESC
    LIMIT 1
  `).get(agentName) as RunLogRow | undefined
  return row ? mapRunLog(row) : undefined
}

export {
  insertOrReplaceFixture,
  upsertTeamStats,
  upsertMatchStats,
  insertPrediction,
  insertRunLog,
  updateRunLog,
  getAllPlayers,
} from './write'

export { seedTeams } from './seed'

// ============================================================================
// User management
// ============================================================================

export interface User {
  id: number
  username: string
  createdAt: string
}

export function getUserByUsername(username: string): (User & { passwordHash: string }) | undefined {
  const row = getDb()
    .prepare('SELECT id, username, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE username = ?')
    .get(username) as (User & { passwordHash: string }) | undefined
  return row
}

export function createUser(username: string, passwordHash: string): User {
  const createdAt = new Date().toISOString()
  const result = getDb()
    .prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
    .run(username, passwordHash, createdAt)

  return {
    id: Number(result.lastInsertRowid),
    username,
    createdAt,
  }
}

export function userExists(username: string): boolean {
  const row = getDb().prepare('SELECT 1 FROM users WHERE username = ?').get(username)
  return !!row
}
