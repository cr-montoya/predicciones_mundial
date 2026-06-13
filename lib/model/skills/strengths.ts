import type { Team } from '@/lib/types'
import { STRENGTH_MIN, STRENGTH_MAX } from '@/lib/model/constants'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Skill puro: dado un conjunto de equipos con avgGoals, devuelve los mismos
 * equipos con attackStrength/defenseStrength normalizados contra la media. Sin
 * imports de DB ni red, asi corre igual en runtime Workers, build y scripts.
 */
export function computeStrengths(teams: Team[]): Team[] {
  const scoredVals = teams
    .map(t => t.avgGoalsScored)
    .filter((v): v is number => v !== null)

  const concededVals = teams
    .map(t => t.avgGoalsConceded)
    .filter((v): v is number => v !== null)

  if (scoredVals.length === 0 || concededVals.length === 0) return teams

  const meanScored = mean(scoredVals)
  const meanConceded = mean(concededVals)

  return teams.map(team => ({
    ...team,
    attackStrength:
      team.avgGoalsScored !== null && meanScored > 0
        ? clamp(team.avgGoalsScored / meanScored, STRENGTH_MIN, STRENGTH_MAX)
        : 1.0,
    defenseStrength:
      team.avgGoalsConceded !== null && meanConceded > 0
        ? clamp(team.avgGoalsConceded / meanConceded, STRENGTH_MIN, STRENGTH_MAX)
        : 1.0,
  }))
}
