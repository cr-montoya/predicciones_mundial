import { getTeams, upsertTeamStats } from '@/lib/db/client'
import { computeStrengths } from '@/lib/model/skills/strengths'

// Re-exported for compatibility: the pure function lives in the skill (no DB),
// so the ISR path does not pull better-sqlite3 into the Worker bundle.
export { computeStrengths }

export function recomputeStrengths(): void {
  const withStrengths = computeStrengths(getTeams())

  for (const team of withStrengths) {
    upsertTeamStats(team.id, {
      avgGoalsScored: team.avgGoalsScored,
      avgGoalsConceded: team.avgGoalsConceded,
      attackStrength: team.attackStrength,
      defenseStrength: team.defenseStrength,
    })
  }
}
