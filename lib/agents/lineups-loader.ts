import { ApiFootballProvider } from '@/lib/data/providers/api-football'
import type { Player, PlayerScorerInput, ExcludedPlayer, FixtureLineupData, PlayerInjuryData, ModelOutput } from '@/lib/types'
import { squadsByTeamId } from '@/lib/data/squads'
import { DEFAULT_STARTER_PROBABILITY } from '@/lib/model/scorer-defaults'

// Lineups are typically published within this window before kickoff
const NEAR_KICKOFF_WINDOW_MS = 2 * 60 * 60 * 1000

export interface LineupsLoaderOutput {
  lineup: FixtureLineupData | null
  injuries: PlayerInjuryData[]
  homeScorerInputs: PlayerScorerInput[]
  awayScorerInputs: PlayerScorerInput[]
  excludedPlayers: ExcludedPlayer[]
  lineupFetchedAt: string | null
  lineupConfidence: ModelOutput['confidence']
}

export async function loadLineups(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number,
  kickoffUtc: string
): Promise<LineupsLoaderOutput> {
  const now = Date.now()
  const kickoff = new Date(kickoffUtc).getTime()
  const nearKickoff = now >= kickoff - NEAR_KICKOFF_WINDOW_MS

  let lineup: FixtureLineupData | null = null
  let injuries: PlayerInjuryData[] = []

  if (nearKickoff) {
    const provider = new ApiFootballProvider()
    const [l, inj] = await Promise.all([
      provider.fetchLineups(fixtureId),
      provider.fetchInjuries(fixtureId),
    ])
    lineup = l
    injuries = inj
  }

  const homePlayers: Player[] = squadsByTeamId[homeTeamId] ?? []
  const awayPlayers: Player[] = squadsByTeamId[awayTeamId] ?? []
  const excludedPlayers: ExcludedPlayer[] = []

  function buildInputs(players: Player[]): PlayerScorerInput[] {
    const result: PlayerScorerInput[] = []
    for (const p of players) {
      if (p.goalsPerMinute === null || p.goalsPerMinute <= 0) continue

      const injury = injuries.find(i => i.playerId === p.id)
      if (injury && injury.starterProbabilityOverride === 0) {
        excludedPlayers.push({
          playerId: p.id,
          playerName: p.name,
          teamId: p.teamId,
          reason: injury.injuryType === 'suspended' ? 'suspended' : 'injured',
        })
        continue
      }

      let sp = DEFAULT_STARTER_PROBABILITY[p.position] ?? 0.5
      let status: PlayerScorerInput['lineupStatus'] = 'unknown'

      if (injury) {
        sp = injury.starterProbabilityOverride
        status = 'unknown'
      } else if (lineup) {
        const lp = lineup.players.find(l => l.playerId === p.id)
        if (lp?.status === 'confirmed_starter') { sp = 1.0; status = 'confirmed_starter' }
        else if (lp?.status === 'bench') { sp = 0.1; status = 'bench' }
      }

      result.push({
        playerId: p.id,
        playerName: p.name,
        teamId: p.teamId,
        goalsPerMinute: p.goalsPerMinute,
        starterProbability: sp,
        lineupStatus: status,
      })
    }
    return result
  }

  const homeScorerInputs = buildInputs(homePlayers)
  const awayScorerInputs = buildInputs(awayPlayers)
  const lineupConfidence: ModelOutput['confidence'] = lineup !== null ? 'medium' : 'low'

  return {
    lineup,
    injuries,
    homeScorerInputs,
    awayScorerInputs,
    excludedPlayers,
    lineupFetchedAt: lineup?.confirmedAt ?? null,
    lineupConfidence,
  }
}
