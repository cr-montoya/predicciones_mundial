import Link from 'next/link'
import type { FixtureWithTeams } from '@/lib/agents/home-types'

interface FixturesTodayProps {
  fixtures: FixtureWithTeams[]
}

function formatTime(utc: string): string {
  return new Date(utc).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

function statusLabel(status: string): string {
  if (status === 'finished') return 'FT'
  if (status === 'live') return 'LIVE'
  return 'SCH'
}

function statusColor(status: string): string {
  if (status === 'live') return 'var(--accent)'
  if (status === 'finished') return 'var(--muted)'
  return '#555'
}

export function FixturesToday({ fixtures }: FixturesTodayProps) {
  if (fixtures.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
        PARTIDOS
      </h2>
      <div className="flex flex-col border-t" style={{ borderColor: 'var(--border)' }}>
        {fixtures.map(({ fixture, label, prediction }) => {
          const hasScore =
            fixture.homeGoals !== null && fixture.awayGoals !== null
          return (
            <Link
              key={fixture.id}
              href={`/fixtures/${fixture.id}`}
              className="flex items-center gap-4 py-3 border-b transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--border)' }}
            >
              <span
                className="text-xs w-12 font-bold tracking-wider"
                style={{ color: statusColor(fixture.status) }}
              >
                {statusLabel(fixture.status)}
              </span>
              <span className="text-xs w-12 tabular-nums" style={{ color: 'var(--muted)' }}>
                {formatTime(fixture.kickoffUtc)}
              </span>
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-sm text-white tracking-wide">{label}</span>
                {prediction && (
                  <span className="flex gap-3 text-xs mt-0.5">
                    <span style={{ color: 'var(--accent)' }}>
                      {prediction.winner} {Math.round(prediction.winnerProb * 100)}%
                    </span>
                    <span style={{ color: 'var(--muted)' }}>
                      {prediction.expectedGoals} goles
                    </span>
                  </span>
                )}
              </span>
              {hasScore && (
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: 'var(--accent)' }}
                >
                  {fixture.homeGoals} - {fixture.awayGoals}
                </span>
              )}
              <span className="text-xs tracking-wider" style={{ color: 'var(--muted)' }}>
                VER →
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
