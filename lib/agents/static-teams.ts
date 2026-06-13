import type { Team } from '@/lib/types'
import { worldCupTeams } from '@/lib/data/teams-seed'
import historicalStats from '@/lib/data/historical-stats.json'
import { computeStrengths } from '@/lib/model/skills/strengths'

type HistoricalEntry = { avgGoalsScored: number; avgGoalsConceded: number }

/**
 * Construye los 48 equipos del Mundial con sus fuerzas calculadas, usando solo
 * datos estaticos commiteados (teams-seed + historical-stats.json). No toca DB
 * ni red, asi que corre igual en build, en runtime Workers y en scripts.
 */
export function buildStaticTeams(): Team[] {
  const statsMap = historicalStats.teams as Record<string, HistoricalEntry>

  const teams: Team[] = worldCupTeams.map(t => {
    const stats = statsMap[t.id.toString()]
    return {
      id: t.id,
      name: t.name,
      group: t.group,
      fifaRanking: null,
      attackStrength: 1.0,
      defenseStrength: 1.0,
      homeAdvantage: t.homeAdvantage,
      recentForm: null,
      avgGoalsScored: stats?.avgGoalsScored ?? null,
      avgGoalsConceded: stats?.avgGoalsConceded ?? null,
    }
  })

  return computeStrengths(teams)
}
