import { loadFixtures, teamMap, computePredictionsRetroactive } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { computeGroupStandings, getGroupPosition, getBestThird } from '@/lib/skills/standings'
import { normalizeKnockoutStage } from '@/lib/skills/bracket'
import { ROUND_OF_32_DEFS } from '@/lib/data/wc2026-bracket-structure'
import { BracketView } from '@/components/bracket-view'
import type { ResolvedMatchup, ResolvedTeam } from '@/components/bracket-matchup'
import type { BracketSlot } from '@/lib/data/wc2026-bracket-structure'
import type { Team, ModelOutput, Fixture } from '@/lib/types'

export const revalidate = 3600

export const metadata = {
  title: 'Bracket',
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

  // Index confirmed R32 fixtures by team ID so we can use real matchups when available.
  // Falls back to resolveSlot (standings projection) for any slot not yet confirmed by the API.
  const r32ByTeam = new Map<number, Fixture>()
  for (const f of allFixtures) {
    if (normalizeKnockoutStage(f.round) !== 'round_of_32') continue
    r32ByTeam.set(f.homeTeamId, f)
    r32ByTeam.set(f.awayTeamId, f)
  }

  const matchups: ResolvedMatchup[] = ROUND_OF_32_DEFS.map(def => {
    const projHome = resolveSlot(def.home, standings, byId)
    const projAway = resolveSlot(def.away, standings, byId)

    // Prefer confirmed API fixture over standings projection
    const confirmedF: Fixture | null =
      (projHome.teamId !== null ? r32ByTeam.get(projHome.teamId) : null) ??
      (projAway.teamId !== null ? r32ByTeam.get(projAway.teamId) : null) ??
      null

    let home = projHome
    let away = projAway

    if (confirmedF !== null) {
      const homeTeam = byId.get(confirmedF.homeTeamId)
      const awayTeam = byId.get(confirmedF.awayTeamId)
      // Map each projected team's position label to its teamId so the label follows
      // the team regardless of whether the API flips home/away vs. the def order.
      const labelByTeamId = new Map<number, string>()
      if (projHome.teamId !== null) labelByTeamId.set(projHome.teamId, projHome.positionLabel)
      if (projAway.teamId !== null) labelByTeamId.set(projAway.teamId, projAway.positionLabel)
      home = { teamId: confirmedF.homeTeamId, name: homeTeam?.name ?? null, positionLabel: labelByTeamId.get(confirmedF.homeTeamId) ?? projHome.positionLabel, isProjected: false }
      away = { teamId: confirmedF.awayTeamId, name: awayTeam?.name ?? null, positionLabel: labelByTeamId.get(confirmedF.awayTeamId) ?? projAway.positionLabel, isProjected: false }
    }

    let prediction: ModelOutput | undefined
    if (home.teamId !== null && away.teamId !== null) {
      const homeTeam = byId.get(home.teamId)
      const awayTeam = byId.get(away.teamId)
      if (homeTeam && awayTeam) {
        const fakeFixture: Fixture = {
          id: 0,
          homeTeamId: home.teamId,
          awayTeamId: away.teamId,
          kickoffUtc: '',
          status: 'scheduled',
          homeGoals: null,
          awayGoals: null,
          round: 'LAST_32',
        }
        const preds = computePredictionsRetroactive(fakeFixture, byId)
        prediction = preds.find(p => p.market === 'result_1x2')
      }
    }

    const confirmedScore =
      confirmedF !== null &&
      (confirmedF.status === 'finished' || confirmedF.status === 'live') &&
      confirmedF.homeGoals !== null &&
      confirmedF.awayGoals !== null
        ? { homeGoals: confirmedF.homeGoals, awayGoals: confirmedF.awayGoals }
        : undefined

    const isLive = confirmedF?.status === 'live' || undefined

    return {
      matchId: def.matchId,
      home,
      away,
      prediction,
      confirmedScore,
      isLive,
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
