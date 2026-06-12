import type { Fixture } from '@/lib/types'
import {
  getFixtures, getTeams, getPlayersByTeam, getMatchStats,
  insertPrediction, upsertMatchStats, upsertTeamStats, getAllPlayers,
} from '@/lib/db/client'
import { fetchMatchStats, fetchMatchEvents, fetchTeamStats } from '@/lib/data/api-football'
import { computeMatchOutputs } from '@/lib/model/match-model'
import { simulateTournament } from '@/lib/model/montecarlo'
import { recomputeStrengths } from './strength-batch'
import historicalStats from '@/lib/data/historical-stats.json'

export function loadHistoricalStats(): void {
  const teams = getTeams()
  const teamStatsMap = historicalStats.teams as Record<string, { avgGoalsScored: number; avgGoalsConceded: number }>
  for (const team of teams) {
    const stats = teamStatsMap[team.id.toString()]
    if (stats) {
      upsertTeamStats(team.id, {
        avgGoalsScored: stats.avgGoalsScored,
        avgGoalsConceded: stats.avgGoalsConceded,
        attackStrength: 1.0,
        defenseStrength: 1.0,
      })
    }
  }
  recomputeStrengths()
}

export async function fetchAndStoreMatchData(fixtures: Fixture[]): Promise<void> {
  for (const f of fixtures) {
    const stats = await fetchMatchStats(f.id)
    for (const s of stats) upsertMatchStats(s)
    await fetchMatchEvents(f.id)
  }
}

export async function refreshTeamStats(teamIds: number[]): Promise<void> {
  for (const teamId of teamIds) {
    const partial = await fetchTeamStats(teamId, 1, 2026)
    if (partial.avgGoalsScored !== undefined || partial.avgGoalsConceded !== undefined) {
      upsertTeamStats(teamId, {
        avgGoalsScored: partial.avgGoalsScored ?? null,
        avgGoalsConceded: partial.avgGoalsConceded ?? null,
        attackStrength: 1.0,
        defenseStrength: 1.0,
      })
    }
  }
  recomputeStrengths()
}

export async function recalculatePredictions(): Promise<number> {
  const teams = getTeams()
  const teamById = new Map(teams.map(t => [t.id, t]))
  const pending = getFixtures().filter(f => f.status !== 'finished')
  const allPlayers = getAllPlayers()
  let count = 0

  for (const fixture of pending) {
    const home = teamById.get(fixture.homeTeamId)
    const away = teamById.get(fixture.awayTeamId)
    if (!home || !away) continue

    const matchStats = getMatchStats(fixture.id)
    const homePlayers = getPlayersByTeam(fixture.homeTeamId)
    const awayPlayers = getPlayersByTeam(fixture.awayTeamId)

    const outputs = computeMatchOutputs({ fixture, home, away, matchStats, homePlayers, awayPlayers })
    for (const output of outputs) {
      insertPrediction(fixture.id, output)
      count++
    }
  }

  const { winner, goldenBoot } = simulateTournament({ teams, players: allPlayers })
  insertPrediction(null, winner)
  insertPrediction(null, goldenBoot)
  count += 2

  return count
}
