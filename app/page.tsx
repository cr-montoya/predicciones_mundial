import {
  getLatestTournamentPredictions,
  getLastRunLog,
} from '@/lib/db/client'
import { RefreshButton } from '@/components/refresh-button'
import type { ModelOutput } from '@/lib/types'

function formatRefreshTime(log: ReturnType<typeof getLastRunLog>): string {
  if (!log || log.status !== 'ok' || !log.finishedAt) return ''
  const d = new Date(log.finishedAt)
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TopFive({
  output,
  title,
}: {
  output: ModelOutput | undefined
  title: string
}) {
  if (!output) return null

  const sorted = Object.entries(output.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="border p-6 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
      <h2 className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {sorted.map(([key, prob], i) => (
          <div key={key} className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-xs w-4" style={{ color: 'var(--muted)' }}>
                {i + 1}
              </span>
              <span className="text-sm tracking-wide text-white">{key}</span>
            </div>
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color: 'var(--accent)' }}
            >
              {Math.round(prob * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const predictions = getLatestTournamentPredictions()
  const cliLog = getLastRunLog('cli_refresh')
  const serverLog = getLastRunLog('server_action')

  const lastRefresh = [cliLog, serverLog]
    .filter((l): l is NonNullable<typeof cliLog> => l != null && l.status === 'ok')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))[0]

  const refreshTime = formatRefreshTime(lastRefresh)

  const winner = predictions.find((p) => p.market === 'tournament_winner')
  const boot = predictions.find((p) => p.market === 'golden_boot')

  return (
    <div className="flex flex-col gap-12 px-6 py-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-3">
        <h1
          className="text-4xl font-bold tracking-widest"
          style={{ color: 'var(--text)' }}
        >
          PREDICTOR MUNDIAL 2026
        </h1>
        <p className="text-xs tracking-wide" style={{ color: 'var(--muted)' }}>
          {refreshTime
            ? `Último refresh: ${refreshTime}`
            : 'Sin datos. Pulsa Actualizar.'}
        </p>
        <div className="mt-2">
          <RefreshButton />
        </div>
      </div>

      {(winner || boot) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TopFive output={winner} title="CANDIDATOS A CAMPEÓN" />
          <TopFive output={boot} title="CANDIDATOS A BOTA DE ORO" />
        </div>
      ) : (
        <div
          className="border p-6 text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          Sin predicciones de torneo. Pulsa Actualizar para generar.
        </div>
      )}
    </div>
  )
}
