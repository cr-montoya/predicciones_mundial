import { loadHomeData } from '@/lib/agents/live-loader'
import { LastUpdated } from '@/components/last-updated'
import { Hero } from '@/components/hero'
import { FixturesToday } from '@/components/fixtures-today'
import { TopMarkets } from '@/components/top-markets'
import { Candidates } from '@/components/candidates'

// Los datos se regeneran como maximo una vez por hora (ISR): al recargar ves la
// version cacheada y se actualiza sola tras la ventana, sin gastar la cuota API.
export const revalidate = 3600

export default async function HomePage() {
  const data = await loadHomeData()
  const { fixturesToday, rankedMarkets, allRankedMarkets, tournamentWinner, goldenBoot, fallbackLabel, generatedAt } = data

  return (
    <div className="flex flex-col w-full">
      <Hero fixturesToday={fixturesToday} fallbackLabel={fallbackLabel} />

      <div className="flex flex-col gap-10 px-6 py-10 max-w-4xl mx-auto w-full">
        <LastUpdated generatedAt={generatedAt} />

        {fixturesToday.length > 0 && (
          <FixturesToday fixtures={fixturesToday} />
        )}

        {rankedMarkets.length > 0 ? (
          <TopMarkets initial={rankedMarkets} all={allRankedMarkets} />
        ) : (
          <div
            className="border py-6 px-4 text-sm tracking-wide"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            SIN PARTIDOS PROXIMOS CON PREDICCIONES DISPONIBLES.
          </div>
        )}

        <Candidates winner={tournamentWinner} boot={goldenBoot} />
      </div>
    </div>
  )
}
