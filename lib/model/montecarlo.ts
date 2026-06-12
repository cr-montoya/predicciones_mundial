import type { Team, Player, ModelOutput } from '@/lib/types'
import { sanityCheck } from '@/lib/types'
import { MONTE_CARLO_ITERATIONS } from '@/lib/model/constants'
import { simGroupStage } from '@/lib/model/montecarlo/group-stage'
import { simKnockoutStage } from '@/lib/model/montecarlo/knockout'

export interface TournamentInput {
  teams: Team[]
  players: Player[]
}

export interface TournamentOutput {
  winner: ModelOutput
  goldenBoot: ModelOutput
}

export function simulateTournament(input: TournamentInput): TournamentOutput {
  const { teams, players } = input

  const teamById = new Map<number, Team>(teams.map(t => [t.id, t]))
  const teamsByGroup = new Map<string, Team[]>()
  for (const t of teams) {
    const existing = teamsByGroup.get(t.group) ?? []
    existing.push(t)
    teamsByGroup.set(t.group, existing)
  }

  const winnerCount = new Map<number, number>()
  const bootCount = new Map<number, number>()

  for (let iter = 0; iter < MONTE_CARLO_ITERATIONS; iter++) {
    const bootAccumulator = new Map<number, number>()

    const { qualifiers } = simGroupStage(teamsByGroup, players, bootAccumulator)
    const champion = simKnockoutStage(qualifiers, teamById, players, bootAccumulator)

    winnerCount.set(champion, (winnerCount.get(champion) ?? 0) + 1)

    if (bootAccumulator.size > 0) {
      let maxGoals = 0
      let maxPlayerId = -1
      for (const [playerId, goals] of bootAccumulator) {
        if (goals > maxGoals) { maxGoals = goals; maxPlayerId = playerId }
      }
      if (maxPlayerId !== -1) {
        const tied = Array.from(bootAccumulator.entries()).filter(([, g]) => g === maxGoals)
        const share = 1 / tied.length
        for (const [pId] of tied) {
          bootCount.set(pId, (bootCount.get(pId) ?? 0) + share)
        }
      }
    }
  }

  const winnerProbs: Record<string, number> = {}
  for (const t of teams) {
    winnerProbs[t.name] = (winnerCount.get(t.id) ?? 0) / MONTE_CARLO_ITERATIONS
  }

  const winnerOutput: ModelOutput = {
    market: 'tournament_winner',
    probabilities: winnerProbs,
    confidence: 'medium',
    modelVersion: '1.1',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(winnerOutput)

  const hasPlayers = bootCount.size > 0
  const goldenBootOutput: ModelOutput = hasPlayers
    ? buildGoldenBoot(bootCount, players)
    : { market: 'golden_boot', probabilities: {}, confidence: 'low', modelVersion: '1.1', computedAt: new Date().toISOString() }

  return { winner: winnerOutput, goldenBoot: goldenBootOutput }
}

function buildGoldenBoot(
  bootCount: Map<number, number>,
  players: Player[]
): ModelOutput {
  const playerById = new Map<number, Player>(players.map(p => [p.id, p]))
  const total = Array.from(bootCount.values()).reduce((a, b) => a + b, 0)
  const probs: Record<string, number> = {}

  for (const [playerId, count] of bootCount) {
    const p = playerById.get(playerId)
    const label = p ? p.name : `unknown_${playerId}`
    probs[label] = count / total
  }

  const output: ModelOutput = {
    market: 'golden_boot',
    probabilities: probs,
    confidence: 'medium',
    modelVersion: '1.1',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(output)
  return output
}
