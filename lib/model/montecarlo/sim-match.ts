import type { Team, Player } from '@/lib/types'
import { computeLambdas } from '@/lib/model/lambda'
import { P_PENALTY_HOME_WIN, MIN_MINUTES_ELIGIBLE } from '@/lib/model/constants'

function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

export interface MatchResult {
  homeGoals: number
  awayGoals: number
  homeWins: boolean
}

export function simMatch(home: Team, away: Team): MatchResult {
  const { lambdaHome, lambdaAway } = computeLambdas(home, away)
  const homeGoals = samplePoisson(lambdaHome)
  const awayGoals = samplePoisson(lambdaAway)

  let homeWins: boolean
  if (homeGoals > awayGoals) {
    homeWins = true
  } else if (homeGoals < awayGoals) {
    homeWins = false
  } else {
    homeWins = Math.random() < P_PENALTY_HOME_WIN
  }

  return { homeGoals, awayGoals, homeWins }
}

export function assignGoalsToBoot(
  players: Player[],
  teamId: number,
  goalsScored: number,
  bootAccumulator: Map<number, number>
): void {
  const eligible = players.filter(
    p => p.teamId === teamId && p.minutesPlayed >= MIN_MINUTES_ELIGIBLE &&
      p.goalsPerMinute !== null && p.goalsPerMinute > 0
  )
  if (eligible.length === 0 || goalsScored === 0) return

  const denom = eligible.reduce((a, p) => a + (p.goalsPerMinute ?? 0), 0)
  const weights = eligible.map(p => (p.goalsPerMinute ?? 0) / denom)

  for (let g = 0; g < goalsScored; g++) {
    let r = Math.random()
    for (let i = 0; i < eligible.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        const prev = bootAccumulator.get(eligible[i].id) ?? 0
        bootAccumulator.set(eligible[i].id, prev + 1)
        break
      }
    }
  }
}
