export type MatchOutcome = 'home' | 'draw' | 'away'

export interface MatchAccuracyRecord {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  modelCall: MatchOutcome
  actual: MatchOutcome
  correct: boolean
  homeProb: number
  drawProb: number
  awayProb: number
}

export interface AccuracyStats {
  total: number
  correct: number
  pct: number // 0–100, rounded to one decimal
  records: MatchAccuracyRecord[]
}

/** Derives the actual match outcome from the final score. */
export function deriveActualOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/**
 * Returns the top-1 model call (highest probability outcome) from a
 * result_1x2 distribution.
 */
export function topModelCall(probabilities: Record<string, number>): MatchOutcome | null {
  const sorted = Object.entries(probabilities).sort(([, a], [, b]) => b - a)
  const top = sorted[0]?.[0]
  if (top === 'home' || top === 'draw' || top === 'away') return top
  return null
}

/** Compares the model's top-1 call against the actual result. */
export function resolveModelVerdict(
  probabilities: Record<string, number>,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' | null {
  const call = topModelCall(probabilities)
  if (!call) return null
  return call === deriveActualOutcome(homeGoals, awayGoals) ? 'correct' : 'incorrect'
}

/** Aggregates a list of accuracy records into summary stats. */
export function computeAccuracyStats(records: MatchAccuracyRecord[]): AccuracyStats {
  const total = records.length
  const correct = records.filter(r => r.correct).length
  const pct = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0
  return { total, correct, pct, records }
}
