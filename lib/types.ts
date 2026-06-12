export type MarketType =
  | 'result_1x2'
  | 'double_chance'
  | 'over_under_goals'
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

export interface RunLog {
  id?: number
  startedAt: string
  finishedAt: string
  durationMs: number
  status: 'ok' | 'error'
  message?: string
}

export function sanityCheck(output: ModelOutput): void {
  const sum = Object.values(output.probabilities).reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(
      `sanityCheck failed for market ${output.market}: probabilities sum to ${sum}, expected 1.0 ±0.001`
    )
  }
}
