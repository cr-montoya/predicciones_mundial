import type { Team, Player } from '@/lib/types'
import { simMatch, assignGoalsToBoot } from './sim-match'

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pairWithGroupAvoidance(
  qualifiers: number[],
  teamById: Map<number, Team>
): Array<[number, number]> {
  const shuffled = shuffleArray(qualifiers)
  const pairs: Array<[number, number]> = []

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidates = shuffleArray(shuffled)
    const thisPairs: Array<[number, number]> = []
    let valid = true

    for (let i = 0; i < candidates.length; i += 2) {
      const a = teamById.get(candidates[i])!
      const b = teamById.get(candidates[i + 1])!
      if (a.group === b.group) { valid = false; break }
      thisPairs.push([candidates[i], candidates[i + 1]])
    }

    if (valid) return thisPairs
    if (attempt === 9) {
      for (let i = 0; i < shuffled.length; i += 2) {
        thisPairs.push([shuffled[i], shuffled[i + 1]])
      }
      return thisPairs
    }
  }

  return pairs
}

export function simKnockoutStage(
  qualifierIds: number[],
  teamById: Map<number, Team>,
  players: Player[],
  bootAccumulator: Map<number, number>
): number {
  let remaining = qualifierIds

  while (remaining.length > 1) {
    const pairs = remaining.length === 32
      ? pairWithGroupAvoidance(remaining, teamById)
      : shuffleArray(remaining).reduce<Array<[number, number]>>((acc, _, i, arr) => {
          if (i % 2 === 0) acc.push([arr[i], arr[i + 1]])
          return acc
        }, [])

    const winners: number[] = []
    for (const [homeId, awayId] of pairs) {
      const home = teamById.get(homeId)!
      const away = teamById.get(awayId)!
      const { homeGoals, awayGoals, homeWins } = simMatch(home, away)
      assignGoalsToBoot(players, homeId, homeGoals, bootAccumulator)
      assignGoalsToBoot(players, awayId, awayGoals, bootAccumulator)
      winners.push(homeWins ? homeId : awayId)
    }
    remaining = winners
  }

  return remaining[0]
}
