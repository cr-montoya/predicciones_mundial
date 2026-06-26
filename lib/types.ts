export type MarketType =
  | 'result_1x2'
  | 'double_chance'
  | 'over_under_goals_1_5'
  | 'over_under_goals_2_5'
  | 'over_under_goals_3_5'
  | 'btts'
  | 'exact_score'
  | 'first_scorer'
  | 'anytime_scorer'
  | 'total_cards'
  | 'corners'
  | 'clean_sheet'
  | 'tournament_winner'
  | 'golden_boot'
  | 'home_team_goals_0_5'
  | 'home_team_goals_1_5'
  | 'home_team_goals_2_5'
  | 'away_team_goals_0_5'
  | 'away_team_goals_1_5'
  | 'away_team_goals_2_5'
  | 'win_to_nil'

export interface ModelOutput {
  market: MarketType
  probabilities: Record<string, number>
  confidence: 'high' | 'medium' | 'low'
  modelVersion: string
  computedAt: string
}

export type AgentName = 'cli_refresh' | 'server_action'

export interface RunLog {
  id?: number
  /** Who triggered the run: the CLI script (pnpm refresh) or the Server Action. */
  agentName: AgentName
  startedAt: string
  /** null while the run is in progress ('running'); set when the run completes. */
  finishedAt: string | null
  durationMs: number | null
  /**
   * 'running' when the row is inserted at the start of the refresh; updated to
   * 'ok' or 'error' when it finishes. A row stuck in 'running' indicates a
   * process that died mid-run. The freshness guard only counts 'ok' runs.
   */
  status: 'ok' | 'error' | 'running'
  /** null when status IN ('ok', 'running'); exception description when 'error'. */
  message: string | null
}

export interface H2HMatch {
  date: string
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  stage: string
}

export function sanityCheck(output: ModelOutput): void {
  const sum = Object.values(output.probabilities).reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(
      `sanityCheck failed for market ${output.market}: probabilities sum to ${sum}, expected 1.0 ±0.001`
    )
  }
}

// ---------------------------------------------------------------------------
// Domain entities (normalized from DB, never raw API responses).
// These are consumed by the prediction model in lib/model/.
// ---------------------------------------------------------------------------

export type FixtureStatus = 'scheduled' | 'live' | 'finished'

export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW'

export type MatchEventType =
  | 'goal'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'

/**
 * Tournament team. The attackStrength / defenseStrength fields are the
 * coefficients that feed the lambda calculation in the Poisson model.
 *
 * Strength convention: ratios relative to the league/tournament mean, centered
 * at 1.0. attackStrength > 1 => scores more goals than average;
 * defenseStrength > 1 => concedes more goals than average (worse defense).
 * lambdaHome and lambdaAway are derived by combining these strengths with the
 * tournament goal mean and homeAdvantage. Expected coefficient range: [0.3, 3.0];
 * expected resulting lambda: [0.5, 3.5].
 */
export interface Team {
  id: number
  name: string
  /** World Cup 2026 group: 'A'..'L' (12 groups). */
  group: string
  /** Official FIFA ranking. May be absent for a recently qualified team. */
  fifaRanking: number | null
  /** Offensive coefficient relative to the mean (~1.0). */
  attackStrength: number
  /** Defensive coefficient relative to the mean (~1.0). Higher = worse defense. */
  defenseStrength: number
  /**
   * Home advantage multiplier applied to the home team lambda (~1.0 = no
   * advantage). At the World Cup almost all games are on neutral ground except
   * for the hosts (USA, Canada, Mexico), hence this is per-team.
   */
  homeAdvantage: number
  /**
   * Recent form: multiplicative factor derived from the last 5-10 matches
   * (~1.0 = average form). Optional until historical data is available.
   */
  recentForm: number | null
  /** Average goals scored per match (historical). Feeds the strength coefficients. */
  avgGoalsScored: number | null
  /** Average goals conceded per match (historical). */
  avgGoalsConceded: number | null
}

/**
 * Player. goalsPerMinute is used to distribute the team lambda across players
 * and project top scorer / first scorer markets.
 */
export interface Player {
  id: number
  teamId: number
  name: string
  position: PlayerPosition
  /** Goals scored in the historical period considered. */
  goalsScored: number
  /** Minutes played in the same period. 0 if the player has not played. */
  minutesPlayed: number
  /**
   * Goals-per-minute rate = goalsScored / minutesPlayed. Stored pre-computed to
   * avoid division-by-zero at consumption; null when minutesPlayed is 0 (no sample).
   */
  goalsPerMinute: number | null
}

export type LineupStatus = 'confirmed_starter' | 'bench' | 'unknown' | 'out'

export interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  goalsPerMinute: number
  starterProbability: number
  lineupStatus: LineupStatus
}

export interface ExcludedPlayer {
  playerId: number
  playerName: string
  teamId: number
  reason: 'injured' | 'suspended' | 'out'
}

export type InjuryType = 'out' | 'doubtful' | 'suspended'

export interface LineupPlayer {
  playerId: number
  playerName: string
  teamId: number
  status: LineupStatus
}

export interface FixtureLineupData {
  fixtureId: number
  confirmedAt: string
  players: LineupPlayer[]
}

export interface PlayerInjuryData {
  playerId: number
  playerName: string
  teamId: number
  injuryType: InjuryType
  starterProbabilityOverride: number
}

/**
 * Tournament match. homeGoals / awayGoals are null until the match has
 * finished (status !== 'finished').
 */
export interface Fixture {
  id: number
  homeTeamId: number
  awayTeamId: number
  /** Kickoff time in UTC, ISO 8601. */
  kickoffUtc: string
  status: FixtureStatus
  /** null until the match starts/finishes and the score is known. */
  homeGoals: number | null
  awayGoals: number | null
  /** Stage / round: 'group', 'round_of_32', ... Optional. */
  round: string | null
}

/**
 * Aggregated stats for a team in a specific match. Feeds the corners and
 * cards models (regression over historical averages).
 * One row per (fixtureId, teamId): two rows per match.
 */
export interface MatchStats {
  fixtureId: number
  teamId: number
  corners: number | null
  yellowCards: number | null
  redCards: number | null
  shotsOnTarget: number | null
  /** Possession as a percentage [0, 100]. */
  possession: number | null
}

/**
 * Individual match event (timeline). playerId is null for events without
 * an identified player (e.g. incomplete data from the API).
 */
export interface MatchEvent {
  id: number
  fixtureId: number
  type: MatchEventType
  teamId: number
  playerId: number | null
  /** Match minute [1, 120]. */
  minute: number
}
