import type { Team, Player } from '@/lib/types'
import type { GroupStanding } from './types'
import { simMatch, assignGoalsToBoot } from './sim-match'

function compareStanding(a: GroupStanding, b: GroupStanding): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return Math.random() < 0.5 ? -1 : 1
}

export interface GroupResult {
  standings: Map<string, GroupStanding[]>
  qualifiers: number[]
}

export function simGroupStage(
  teamsByGroup: Map<string, Team[]>,
  players: Player[],
  bootAccumulator: Map<number, number>
): GroupResult {
  const standings = new Map<string, GroupStanding[]>()

  for (const [group, teams] of teamsByGroup) {
    const table = new Map<number, GroupStanding>()
    for (const t of teams) {
      table.set(t.id, { teamId: t.id, points: 0, goalDiff: 0, goalsFor: 0 })
    }

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const { homeGoals, awayGoals, homeWins } = simMatch(teams[i], teams[j])
        assignGoalsToBoot(players, teams[i].id, homeGoals, bootAccumulator)
        assignGoalsToBoot(players, teams[j].id, awayGoals, bootAccumulator)

        const home = table.get(teams[i].id)!
        const away = table.get(teams[j].id)!
        home.goalsFor += homeGoals
        away.goalsFor += awayGoals
        home.goalDiff += homeGoals - awayGoals
        away.goalDiff += awayGoals - homeGoals

        if (homeGoals > awayGoals) {
          home.points += 3
        } else if (homeGoals < awayGoals) {
          away.points += 3
        } else {
          home.points += 1
          away.points += 1
        }
      }
    }

    const sorted = Array.from(table.values()).sort(compareStanding)
    standings.set(group, sorted)
  }

  const qualifiers: number[] = []
  const thirds: GroupStanding[] = []

  for (const sorted of standings.values()) {
    qualifiers.push(sorted[0].teamId, sorted[1].teamId)
    if (sorted[2]) thirds.push(sorted[2])
  }

  thirds.sort(compareStanding)
  const best8thirds = thirds.slice(0, 8).map(s => s.teamId)
  qualifiers.push(...best8thirds)

  return { standings, qualifiers }
}
