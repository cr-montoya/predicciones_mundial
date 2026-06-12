import { getTeams, upsertTeamStats } from '@/lib/db/client'
import { STRENGTH_MIN, STRENGTH_MAX } from '@/lib/model/constants'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function recomputeStrengths(): void {
  const teams = getTeams()

  const scoredVals = teams
    .map(t => t.avgGoalsScored)
    .filter((v): v is number => v !== null)

  const concededVals = teams
    .map(t => t.avgGoalsConceded)
    .filter((v): v is number => v !== null)

  if (scoredVals.length === 0 || concededVals.length === 0) return

  const meanScored = mean(scoredVals)
  const meanConceded = mean(concededVals)

  for (const team of teams) {
    const attackStrength =
      team.avgGoalsScored !== null && meanScored > 0
        ? clamp(team.avgGoalsScored / meanScored, STRENGTH_MIN, STRENGTH_MAX)
        : 1.0

    const defenseStrength =
      team.avgGoalsConceded !== null && meanConceded > 0
        ? clamp(team.avgGoalsConceded / meanConceded, STRENGTH_MIN, STRENGTH_MAX)
        : 1.0

    upsertTeamStats(team.id, {
      avgGoalsScored: team.avgGoalsScored,
      avgGoalsConceded: team.avgGoalsConceded,
      attackStrength,
      defenseStrength,
    })
  }
}
