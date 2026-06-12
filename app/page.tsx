import { Suspense } from 'react'
import { loadHomeData } from '@/lib/agents/home-loader'
import { getLastOkRunLog } from '@/lib/db/client'
import { RefreshButton } from '@/components/refresh-button'
import { LastUpdated } from '@/components/last-updated'
import { CaptureWrapper } from '@/components/capture-wrapper'
import { Hero } from '@/components/hero'
import { FixturesToday } from '@/components/fixtures-today'
import { TopMarkets } from '@/components/top-markets'
import { Candidates } from '@/components/candidates'

export default function HomePage() {
  const data = loadHomeData()
  const cliLog = getLastOkRunLog('cli_refresh')
  const serverLog = getLastOkRunLog('server_action')

  const lastRefresh = [cliLog, serverLog]
    .filter((l): l is NonNullable<typeof cliLog> => l != null && l.status === 'ok')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))[0]

  const { fixturesToday, rankedMarkets, allRankedMarkets, tournamentWinner, goldenBoot, fallbackLabel } = data

  return (
    <div className="flex flex-col w-full">
      <Hero fixturesToday={fixturesToday} fallbackLabel={fallbackLabel} />

      <div className="flex flex-col gap-10 px-6 py-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <LastUpdated log={lastRefresh} />
          <Suspense>
            <CaptureWrapper captureHidden={null}>
              <RefreshButton />
            </CaptureWrapper>
          </Suspense>
        </div>

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
            SIN PREDICCIONES. PULSA ACTUALIZAR PARA GENERAR.
          </div>
        )}

        <Candidates winner={tournamentWinner} boot={goldenBoot} />
      </div>
    </div>
  )
}
