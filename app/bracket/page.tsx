import { loadFixtures, teamMap, computePredictionsRetroactive } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { computeGroupStandings, getGroupPosition, getBestThird } from '@/lib/skills/standings'
import { ROUND_OF_32_DEFS } from '@/lib/data/wc2026-bracket-structure'
import { BracketView } from '@/components/bracket-view'
import type { ResolvedMatchup, ResolvedTeam } from '@/components/bracket-matchup'
import type { BracketSlot } from '@/lib/data/wc2026-bracket-structure'
import type { Team, ModelOutput } from '@/lib/types'

export const revalidate = 3600

export const metadata = {
  title: 'Bracket — Mundial 2026 IA Predictor',
}

function resolveSlot(
  slot: BracketSlot,
  standings: ReturnType<typeof computeGroupStandings>,
  byId: Map<number, Team>,
): ResolvedTeam {
  if (slot.kind === 'group_pos') {
    const standing = getGroupPosition(standings, slot.group, slot.position)
    const team = standing ? byId.get(standing.teamId) : null
    const posLabel = `${slot.position === 1 ? '1°' : '2°'} Grupo ${slot.group}`
    return {
      teamId: team?.id ?? null,
      name: team?.name ?? null,
      positionLabel: posLabel,
      isProjected: true,
    }
  } else {
    const standing = getBestThird(standings, slot.eligibleGroups)
    const team = standing ? byId.get(standing.teamId) : null
    const posLabel = `Mejor 3° ${slot.eligibleGroups.join('/')}`
    return {
      teamId: team?.id ?? null,
      name: team?.name ?? null,
      positionLabel: posLabel,
      isProjected: true,
    }
  }
}

export default async function BracketPage() {
  const allFixtures = await loadFixtures()
  const teams = buildStaticTeams()
  const byId = teamMap(teams)

  // Build teamId → group map for standings computation
  const teamGroups = new Map<number, string>(teams.map(t => [t.id, t.group]))

  const standings = computeGroupStandings(allFixtures, teamGroups)

  // Build map of confirmed knockout fixtures (API has real teams confirmed)
  const confirmedKnockout = new Map<string, { homeGoals: number; awayGoals: number; isLive: boolean }>()
  const confirmedTeams = new Map<string, { homeId: number; awayId: number }>()
  for (const f of allFixtures) {
    if (!f.round || f.round.startsWith('Group Stage')) continue
    if (f.status === 'finished' && f.homeGoals !== null && f.awayGoals !== null) {
      confirmedKnockout.set(String(f.id), { homeGoals: f.homeGoals, awayGoals: f.awayGoals, isLive: false })
    }
    if (f.status === 'live') {
      confirmedKnockout.set(String(f.id), { homeGoals: f.homeGoals ?? 0, awayGoals: f.awayGoals ?? 0, isLive: true })
    }
    confirmedTeams.set(String(f.id), { homeId: f.homeTeamId, awayId: f.awayTeamId })
  }

  const matchups: ResolvedMatchup[] = ROUND_OF_32_DEFS.map(def => {
    const home = resolveSlot(def.home, standings, byId)
    const away = resolveSlot(def.away, standings, byId)

    let prediction: ModelOutput | undefined
    if (home.teamId !== null && away.teamId !== null) {
      const homeTeam = byId.get(home.teamId)
      const awayTeam = byId.get(away.teamId)
      if (homeTeam && awayTeam) {
        const fakeFixture = {
          id: 0,
          homeTeamId: home.teamId,
          awayTeamId: away.teamId,
          kickoffUtc: '',
          status: 'scheduled' as const,
          homeGoals: null,
          awayGoals: null,
          round: 'LAST_32',
        }
        const preds = computePredictionsRetroactive(fakeFixture, byId)
        prediction = preds.find(p => p.market === 'result_1x2')
      }
    }

    return {
      matchId: def.matchId,
      home,
      away,
      prediction,
    }
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#f0ece4',
          letterSpacing: '-0.5px',
          margin: 0,
          marginBottom: 8,
        }}>
          Bracket de Eliminatorias
        </h1>
        <p style={{ fontSize: 14, color: '#6b6d75', margin: 0 }}>
          Proyecciones de la IA basadas en las standings actuales · Mundial 2026
        </p>
      </div>

      <BracketView matchups={matchups} />
    </div>
  )
}
