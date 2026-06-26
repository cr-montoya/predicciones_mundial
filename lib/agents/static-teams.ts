import type { Team } from '@/lib/types'
import { worldCupTeams } from '@/lib/data/teams-seed'
import historicalStats from '@/lib/data/historical-stats.json'
import { computeStrengths } from '@/lib/model/skills/strengths'

type HistoricalEntry = { avgGoalsScored: number; avgGoalsConceded: number }

/**
 * Builds the 48 World Cup teams with computed strengths, using only committed
 * static data (teams-seed + historical-stats.json). No DB or network access,
 * so it runs identically at build time, in the Workers runtime, and in scripts.
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
