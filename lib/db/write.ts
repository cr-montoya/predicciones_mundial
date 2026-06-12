import type { Fixture, MatchStats, ModelOutput, RunLog, Team, Player } from '@/lib/types'
import { db } from './client'
import { mapPlayer } from './mappers'
import type { PlayerRow } from './row-types'

export function insertOrReplaceFixture(fixture: Fixture): void {
  db.prepare(`
    INSERT OR REPLACE INTO fixtures
      (id, home_team_id, away_team_id, kickoff_utc, status, home_goals, away_goals, round)
    VALUES
      (@id, @homeTeamId, @awayTeamId, @kickoffUtc, @status, @homeGoals, @awayGoals, @round)
  `).run({
    id: fixture.id,
    homeTeamId: fixture.homeTeamId,
    awayTeamId: fixture.awayTeamId,
    kickoffUtc: fixture.kickoffUtc,
    status: fixture.status,
    homeGoals: fixture.homeGoals ?? null,
    awayGoals: fixture.awayGoals ?? null,
    round: fixture.round ?? null,
  })
}

export function upsertTeamStats(
  teamId: number,
  stats: Pick<Team, 'avgGoalsScored' | 'avgGoalsConceded' | 'attackStrength' | 'defenseStrength'>
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

export function upsertMatchStats(stats: MatchStats): void {
  db.prepare(`
    INSERT OR REPLACE INTO match_stats
      (fixture_id, team_id, corners, yellow_cards, red_cards, shots_on_target, possession)
    VALUES
      (@fixtureId, @teamId, @corners, @yellowCards, @redCards, @shotsOnTarget, @possession)
  `).run({
    fixtureId: stats.fixtureId,
    teamId: stats.teamId,
    corners: stats.corners ?? null,
    yellowCards: stats.yellowCards ?? null,
    redCards: stats.redCards ?? null,
    shotsOnTarget: stats.shotsOnTarget ?? null,
    possession: stats.possession ?? null,
  })
}

export function insertPrediction(fixtureId: number | null, output: ModelOutput): void {
  db.prepare(`
    INSERT INTO predictions
      (fixture_id, market, probabilities, confidence, model_version, computed_at)
    VALUES
      (@fixtureId, @market, @probabilities, @confidence, @modelVersion, @computedAt)
  `).run({
    fixtureId,
    market: output.market,
    probabilities: JSON.stringify(output.probabilities),
    confidence: output.confidence,
    modelVersion: output.modelVersion,
    computedAt: output.computedAt,
  })
}

export function insertRunLog(
  log: Pick<RunLog, 'agentName' | 'startedAt' | 'status'>
): number {
  const result = db.prepare(`
    INSERT INTO run_log (agent_name, started_at, status, finished_at, duration_ms, message)
    VALUES (@agentName, @startedAt, @status, NULL, NULL, NULL)
  `).run({
    agentName: log.agentName,
    startedAt: log.startedAt,
    status: log.status,
  })
  return (result as unknown as { lastInsertRowid: number }).lastInsertRowid
}

export function updateRunLog(
  id: number,
  patch: Pick<RunLog, 'finishedAt' | 'durationMs' | 'status' | 'message'>
): void {
  db.prepare(`
    UPDATE run_log
    SET finished_at = @finishedAt,
        duration_ms = @durationMs,
        status      = @status,
        message     = @message
    WHERE id = @id
  `).run({
    id,
    finishedAt: patch.finishedAt ?? null,
    durationMs: patch.durationMs ?? null,
    status: patch.status,
    message: patch.message ?? null,
  })
}

export function getAllPlayers(): Player[] {
  const rows = db.prepare('SELECT * FROM players').all() as PlayerRow[]
  return rows.map(mapPlayer)
}
