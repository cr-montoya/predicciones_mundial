import { getTeams, upsertTeamStats } from '@/lib/db/client'
import { computeStrengths } from '@/lib/model/skills/strengths'

// Re-exportado por compatibilidad: la funcion pura vive en el skill (sin DB),
// para que el camino ISR no arrastre better-sqlite3 al bundle del Worker.
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
