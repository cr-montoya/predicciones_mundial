import { notFound } from 'next/navigation'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { loadFixtures, computePredictionsForFixture, teamMap, getSquadForTeam } from '@/lib/agents/live-loader'
import { getFlag } from '@/lib/utils/flags'
import { ModelRatingBars } from '@/components/model-rating-bars'
import { TeamFixtures } from '@/components/team-fixtures'
import { SquadTop } from '@/components/squad-top'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: PageProps) {
  const { id } = await params
  const teamId = parseInt(id, 10)
  if (isNaN(teamId)) notFound()

  const allTeams = buildStaticTeams()
  const byId = teamMap(allTeams)
  const team = byId.get(teamId)
  if (!team) notFound()

  const allFixtures = await loadFixtures()
  const teamFixtures = allFixtures
    .filter(f => f.homeTeamId === teamId || f.awayTeamId === teamId)
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))

  const fixturesWithPredictions = teamFixtures.map(fixture => {
    const isHome = fixture.homeTeamId === teamId
    const rivalId = isHome ? fixture.awayTeamId : fixture.homeTeamId
    const rival = byId.get(rivalId)
    const rivalName = rival?.name ?? `Equipo ${rivalId}`

    const prediction = fixture.status === 'scheduled'
      ? computePredictionsForFixture(fixture, byId).find(p => p.market === 'result_1x2')
      : undefined

    return { fixture, rivalName, rivalId, isHome, prediction }
  })

  const players = getSquadForTeam(teamId)

  const flag = getFlag(team.name)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#6b6d75', textTransform: 'uppercase' }}>
          Grupo {team.group}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {flag && <span style={{ fontSize: 48 }}>{flag}</span>}
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f0ece4', margin: 0, lineHeight: 1.1 }}>
            {team.name}
          </h1>
        </div>
      </div>

      {/* Rating del modelo */}
      <ModelRatingBars
        attackStrength={team.attackStrength}
        defenseStrength={team.defenseStrength}
      />

      {/* Partidos */}
      <TeamFixtures fixtures={fixturesWithPredictions} teamName={team.name} />

      {/* Squad top */}
      {players.length > 0 && (
        <SquadTop players={players} teamName={team.name} />
      )}
    </div>
  )
}
