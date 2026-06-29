import { loadFixtures, teamMap } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { MisPicksClient } from '@/components/mis-picks-client'
import { getServerTranslations } from '@/lib/i18n/server'
import type { FixtureStatus } from '@/lib/types'

export const revalidate = 3600

export const metadata = {
  title: 'My Picks',
}

export interface PickableFixture {
  id: number
  homeTeamName: string
  awayTeamName: string
  status: FixtureStatus
  homeGoals: number | null
  awayGoals: number | null
  kickoffUtc: string
}

export default async function MisPicksPage() {
  const [allFixtures, { t }] = await Promise.all([
    loadFixtures(),
    getServerTranslations(),
  ])
  const byId = teamMap(buildStaticTeams())

  const fixtures: PickableFixture[] = allFixtures.map(f => ({
    id: f.id,
    homeTeamName: byId.get(f.homeTeamId)?.name ?? t.myPicks.teamFallback(f.homeTeamId),
    awayTeamName: byId.get(f.awayTeamId)?.name ?? t.myPicks.teamFallback(f.awayTeamId),
    status: f.status,
    homeGoals: f.homeGoals,
    awayGoals: f.awayGoals,
    kickoffUtc: f.kickoffUtc,
  }))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 28px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#f0ece4',
          letterSpacing: '-0.5px',
          margin: 0,
          marginBottom: 8,
        }}>
          {t.myPicks.title}
        </h1>
        <p style={{ fontSize: 14, color: '#6b6d75', margin: 0 }}>
          {t.myPicks.subtitle}
        </p>
      </div>
      <MisPicksClient fixtures={fixtures} />
    </div>
  )
}
