export type PickOutcome = 'home' | 'draw' | 'away'

export interface StoredPick {
  fixtureId: number
  outcome: PickOutcome
  pickedAt: string // ISO 8601 UTC
}

/** Derives the actual match outcome from the final score. */
export function deriveOutcome(homeGoals: number, awayGoals: number): PickOutcome {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/** Compares the user's pick against the final result. */
export function resolveVerdict(
  pick: PickOutcome,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' {
  return pick === deriveOutcome(homeGoals, awayGoals) ? 'correct' : 'incorrect'
}
