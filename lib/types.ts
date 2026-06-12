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
  /** Quien dispara la corrida: el script CLI (pnpm refresh) o el Server Action. */
  agentName: AgentName
  startedAt: string
  /** null mientras la corrida esta en curso ('running'); se completa al terminar. */
  finishedAt: string | null
  durationMs: number | null
  /**
   * 'running' al insertar la fila al inicio del refresh; se actualiza a 'ok' o
   * 'error' al terminar. Una fila que queda en 'running' indica un proceso que
   * murio a mitad. La guarda de frescura solo cuenta corridas 'ok'.
   */
  status: 'ok' | 'error' | 'running'
  /** null cuando status IN ('ok', 'running'); descripcion de la excepcion cuando 'error'. */
  message: string | null
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
// Entidades de dominio (normalizadas desde DB, nunca respuesta cruda de API).
// Estas son las que consume el modelo de predicción en lib/model/.
// ---------------------------------------------------------------------------

export type FixtureStatus = 'scheduled' | 'live' | 'finished'

export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW'

export type MatchEventType =
  | 'goal'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'

/**
 * Selección del torneo. Los campos attackStrength / defenseStrength son los
 * coeficientes que alimentan el cálculo de lambda en el modelo de Poisson.
 *
 * Convención de las fuerzas: ratios relativos a la media de la liga/torneo,
 * centrados en 1.0. attackStrength > 1 => marca más goles que la media;
 * defenseStrength > 1 => concede más goles que la media (peor defensa).
 * lambdaHome y lambdaAway se derivan combinando estas fuerzas con la media
 * de goles del torneo y homeAdvantage. Rango esperado de los coeficientes:
 * [0.3, 3.0]; lambda resultante esperado en [0.5, 3.5].
 */
export interface Team {
  id: number
  name: string
  /** Grupo del Mundial 2026: 'A'..'L' (12 grupos). */
  group: string
  /** Ranking FIFA oficial. Puede faltar para algún equipo recién clasificado. */
  fifaRanking: number | null
  /** Coeficiente ofensivo relativo a la media (~1.0). */
  attackStrength: number
  /** Coeficiente defensivo relativo a la media (~1.0). Mayor = peor defensa. */
  defenseStrength: number
  /**
   * Multiplicador de ventaja de localía aplicado al lambda del equipo local
   * (~1.0 = sin ventaja). En Mundial casi todos juegan en campo neutral salvo
   * los anfitriones (USA, Canadá, México), por eso es por equipo.
   */
  homeAdvantage: number
  /**
   * Forma reciente: factor multiplicativo derivado de los últimos 5-10
   * partidos (~1.0 = en forma media). Opcional hasta que haya historial.
   */
  recentForm: number | null
  /** Goles a favor promedio por partido (histórico). Alimenta las fuerzas. */
  avgGoalsScored: number | null
  /** Goles en contra promedio por partido (histórico). */
  avgGoalsConceded: number | null
}

/**
 * Jugador. goalsPerMinute se usa para repartir el lambda del equipo entre
 * los jugadores y proyectar goleador / primer goleador.
 */
export interface Player {
  id: number
  teamId: number
  name: string
  position: PlayerPosition
  /** Goles anotados en el periodo histórico considerado. */
  goalsScored: number
  /** Minutos jugados en el mismo periodo. 0 si no ha jugado. */
  minutesPlayed: number
  /**
   * Tasa goles/minuto = goalsScored / minutesPlayed. Almacenada para evitar
   * división por cero en consumo; null si minutesPlayed es 0 (sin muestra).
   */
  goalsPerMinute: number | null
}

/**
 * Partido del torneo. homeGoals / awayGoals son null mientras el partido no
 * haya terminado (status !== 'finished').
 */
export interface Fixture {
  id: number
  homeTeamId: number
  awayTeamId: number
  /** Hora de inicio en UTC, ISO 8601. */
  kickoffUtc: string
  status: FixtureStatus
  /** null hasta que el partido empieza/termina y se conoce el marcador. */
  homeGoals: number | null
  awayGoals: number | null
  /** Fase / ronda: 'group', 'round_of_32', ... Opcional. */
  round: string | null
}

/**
 * Estadísticas agregadas de un equipo en un partido concreto. Alimenta los
 * modelos de corners y tarjetas (regresión sobre promedios históricos).
 * Una fila por (fixtureId, teamId): dos filas por partido.
 */
export interface MatchStats {
  fixtureId: number
  teamId: number
  corners: number | null
  yellowCards: number | null
  redCards: number | null
  shotsOnTarget: number | null
  /** Posesión en porcentaje [0, 100]. */
  possession: number | null
}

/**
 * Evento individual de un partido (timeline). playerId es null para eventos
 * sin jugador identificado (p. ej. dato incompleto de la API).
 */
export interface MatchEvent {
  id: number
  fixtureId: number
  type: MatchEventType
  teamId: number
  playerId: number | null
  /** Minuto del partido [1, 120]. */
  minute: number
}
