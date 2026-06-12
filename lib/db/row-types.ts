export interface TeamRow {
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

export interface PlayerRow {
  id: number
  team_id: number
  name: string
  position: string
  goals_scored: number
  minutes_played: number
  goals_per_minute: number | null
}

export interface FixtureRow {
  id: number
  home_team_id: number
  away_team_id: number
  kickoff_utc: string
  status: string
  home_goals: number | null
  away_goals: number | null
  round: string | null
}

export interface MatchStatsRow {
  fixture_id: number
  team_id: number
  corners: number | null
  yellow_cards: number | null
  red_cards: number | null
  shots_on_target: number | null
  possession: number | null
}

export interface MatchEventRow {
  id: number
  fixture_id: number
  type: string
  team_id: number
  player_id: number | null
  minute: number
}

export interface PredictionRow {
  id: number
  fixture_id: number
  market: string
  probabilities: string
  confidence: string
  model_version: string
  computed_at: string
}

export interface RunLogRow {
  id: number
  agent_name: string
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  status: string
  message: string | null
}
