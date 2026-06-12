import type {
  Team, Player, Fixture, FixtureStatus, MatchStats, MatchEvent,
  MatchEventType, PlayerPosition, ModelOutput, MarketType, RunLog, AgentName,
} from '@/lib/types'
import type {
  TeamRow, PlayerRow, FixtureRow, MatchStatsRow,
  MatchEventRow, PredictionRow, RunLogRow,
} from './row-types'

export type {
  TeamRow, PlayerRow, FixtureRow, MatchStatsRow,
  MatchEventRow, PredictionRow, RunLogRow,
}

export function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    group: row.group,
    fifaRanking: row.fifa_ranking,
    attackStrength: row.attack_strength,
    defenseStrength: row.defense_strength,
    homeAdvantage: row.home_advantage,
    recentForm: row.recent_form,
    avgGoalsScored: row.avg_goals_scored,
    avgGoalsConceded: row.avg_goals_conceded,
  }
}

export function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    position: row.position as PlayerPosition,
    goalsScored: row.goals_scored,
    minutesPlayed: row.minutes_played,
    goalsPerMinute: row.goals_per_minute,
  }
}

export function mapFixture(row: FixtureRow): Fixture {
  return {
    id: row.id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    kickoffUtc: row.kickoff_utc,
    status: row.status as FixtureStatus,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    round: row.round,
  }
}

export function mapMatchStats(row: MatchStatsRow): MatchStats {
  return {
    fixtureId: row.fixture_id,
    teamId: row.team_id,
    corners: row.corners,
    yellowCards: row.yellow_cards,
    redCards: row.red_cards,
    shotsOnTarget: row.shots_on_target,
    possession: row.possession,
  }
}

export function mapMatchEvent(row: MatchEventRow): MatchEvent {
  return {
    id: row.id,
    fixtureId: row.fixture_id,
    type: row.type as MatchEventType,
    teamId: row.team_id,
    playerId: row.player_id,
    minute: row.minute,
  }
}

export function mapPrediction(row: PredictionRow): ModelOutput {
  return {
    market: row.market as MarketType,
    probabilities: JSON.parse(row.probabilities) as Record<string, number>,
    confidence: row.confidence as ModelOutput['confidence'],
    modelVersion: row.model_version,
    computedAt: row.computed_at,
  }
}

export function mapRunLog(row: RunLogRow): RunLog {
  return {
    id: row.id,
    agentName: row.agent_name as AgentName,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    status: row.status as RunLog['status'],
    message: row.message,
  }
}
