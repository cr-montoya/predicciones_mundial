export const AVG_GOALS_PER_TEAM = 1.35
export const LAMBDA_MIN = 0.20
export const LAMBDA_MAX = 4.50
export const FORM_MIN = 0.70
export const FORM_MAX = 1.30
export const MAX_GOALS = 8
export const N_RECENT_MATCHES = 5
export const STAGE_MULTIPLIER: Record<string, number> = {
  group: 1.00,
  round_of_32: 1.05,
  round_of_16: 1.10,
  quarter_final: 1.15,
  semi_final: 1.20,
  final: 1.20,
}
export const WC_AVG_YELLOW_PER_MATCH = 3.5
export const WC_AVG_RED_PER_MATCH = 0.10
export const WC_AVG_CORNERS_PER_MATCH = 10.0
export const CORNERS_FALLBACK_LINE = 10.5
export const CARDS_LINE = 3.5
export const MIN_MINUTES_ELIGIBLE = 90
export const MONTE_CARLO_ITERATIONS = 10000
export const P_PENALTY_HOME_WIN = 0.5
export const STRENGTH_MIN = 0.30
export const STRENGTH_MAX = 3.00
export const REFRESH_GUARD_MINUTES = 1
/** Ventana de cache ISR: los datos en vivo (fixtures) se revalidan cada hora. */
export const DATA_REVALIDATE_SECONDS = 3600
