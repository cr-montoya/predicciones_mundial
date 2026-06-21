import { loadHomeData } from '@/lib/agents/live-loader'
import { LastUpdated } from '@/components/last-updated'
import { Hero } from '@/components/hero'
import { FixturesToday } from '@/components/fixtures-today'
import { TopMarkets } from '@/components/top-markets'
import { Candidates } from '@/components/candidates'
import { AccuracyWidget } from '@/components/accuracy-widget'
import { PicksReminderBanner } from '@/components/picks-reminder-banner'

export const revalidate = 3600

export default async function HomePage() {
  const data = await loadHomeData()
  const { fixturesToday, rankedMarkets, allRankedMarkets, tournamentWinner, goldenBoot, fallbackLabel, generatedAt, accuracyStats } = data

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 60px' }}>
      <Hero fixturesToday={fixturesToday} fallbackLabel={fallbackLabel} />
      <PicksReminderBanner fixtures={fixturesToday.map((f) => f.fixture)} />
      <LastUpdated generatedAt={generatedAt} />

      {fixturesToday.length > 0 && (
        <FixturesToday fixtures={fixturesToday} />
      )}

      {rankedMarkets.length > 0 ? (
        <TopMarkets initial={rankedMarkets} all={allRankedMarkets} />
      ) : (
        <div style={{
          padding: '24px 16px',
          border: '1px solid rgba(255,255,255,0.04)',
          fontSize: 13,
          color: '#6b6d75',
          marginBottom: 36,
        }}>
          Sin partidos próximos con predicciones disponibles.
        </div>
      )}

      <Candidates winner={tournamentWinner} boot={goldenBoot} />
      <AccuracyWidget stats={accuracyStats} />
    </div>
  )
}
