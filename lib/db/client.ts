import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Team, Player, Fixture, FixtureStatus, MatchStats, MatchEvent, ModelOutput, RunLog, AgentName } from '@/lib/types'
import {
  mapTeam, mapPlayer, mapFixture, mapMatchStats, mapMatchEvent, mapPrediction, mapRunLog,
  type TeamRow, type PlayerRow, type FixtureRow, type MatchStatsRow,
  type MatchEventRow, type PredictionRow, type RunLogRow,
} from './mappers'
import { seedTeams } from './seed'
import { worldCupTeams } from '@/lib/data/teams-seed'

const DB_PATH = join(process.cwd(), 'data', 'mundial.db')
const SCHEMA_PATH = join(process.cwd(), 'lib', 'db', 'schema.sql')

function migrateRunLog(instance: Database.Database): void {
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

function openDb(): Database.Database {
  const instance = new Database(DB_PATH)
  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')
  const schema = readFileSync(SCHEMA_PATH, 'utf-8')
  instance.exec(schema)
  migrateRunLog(instance)
  seedTeams(instance, worldCupTeams)
  return instance
}

export const db: Database.Database = openDb()

export function getTeams(): Team[] {
  const rows = db.prepare('SELECT * FROM teams').all() as TeamRow[]
  return rows.map(mapTeam)
}

export function getTeamById(id: number): Team | undefined {
  const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined
  return row ? mapTeam(row) : undefined
}

export function getFixtures(status?: FixtureStatus): Fixture[] {
  const rows = status
    ? (db.prepare('SELECT * FROM fixtures WHERE status = ? ORDER BY kickoff_utc').all(status) as FixtureRow[])
    : (db.prepare('SELECT * FROM fixtures ORDER BY kickoff_utc').all() as FixtureRow[])
  return rows.map(mapFixture)
}

export function getFixtureById(id: number): Fixture | undefined {
  const row = db.prepare('SELECT * FROM fixtures WHERE id = ?').get(id) as FixtureRow | undefined
  return row ? mapFixture(row) : undefined
}

export function getPlayersByTeam(teamId: number): Player[] {
  const rows = db.prepare('SELECT * FROM players WHERE team_id = ?').all(teamId) as PlayerRow[]
  return rows.map(mapPlayer)
}

export function getMatchStats(fixtureId: number): MatchStats[] {
  const rows = db.prepare('SELECT * FROM match_stats WHERE fixture_id = ?').all(fixtureId) as MatchStatsRow[]
  return rows.map(mapMatchStats)
}

export function getMatchEvents(fixtureId: number): MatchEvent[] {
  const rows = db
    .prepare('SELECT * FROM match_events WHERE fixture_id = ? ORDER BY minute')
    .all(fixtureId) as MatchEventRow[]
  return rows.map(mapMatchEvent)
}

export function getLatestPredictions(fixtureId: number): ModelOutput[] {
  const rows = db.prepare(`
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
  const rows = db.prepare(`
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
  const row = db.prepare(`
    SELECT * FROM run_log
    WHERE agent_name = ?
    ORDER BY started_at DESC
    LIMIT 1
  `).get(agentName) as RunLogRow | undefined
  return row ? mapRunLog(row) : undefined
}

export function getLastOkRunLog(agentName: AgentName): RunLog | undefined {
  const row = db.prepare(`
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
