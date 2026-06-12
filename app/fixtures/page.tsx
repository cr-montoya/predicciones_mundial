import Link from 'next/link'
import { getFixtures, getTeams } from '@/lib/db/client'
import { FadeIn } from '@/components/fade-in'
import type { Team } from '@/lib/types'

function statusLabel(status: string): string {
  if (status === 'finished') return 'FT'
  if (status === 'live') return 'LIVE'
  return 'SCH'
}

function statusColor(status: string): string {
  if (status === 'finished') return 'var(--muted)'
  if (status === 'live') return 'var(--accent)'
  return '#888'
}

function formatKickoff(utc: string): string {
  const d = new Date(utc)
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FixturesPage() {
  const fixtures = getFixtures()
  const teams = getTeams()
  const teamMap = new Map<number, Team>(teams.map((t) => [t.id, t]))

  return (
    <div className="flex flex-col gap-6 px-6 py-12 max-w-4xl mx-auto w-full">
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-widest" style={{ color: 'var(--text)' }}>
          PARTIDOS
        </h1>
      </FadeIn>
      {fixtures.length === 0 ? (
        <FadeIn delay={0.1}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Sin partidos registrados.
          </p>
        </FadeIn>
      ) : (
        <FadeIn delay={0.1}>
          <div className="flex flex-col border-t" style={{ borderColor: 'var(--border)' }}>
            {fixtures.map((fx) => {
              const home = teamMap.get(fx.homeTeamId)
              const away = teamMap.get(fx.awayTeamId)
              const hasScore = fx.homeGoals !== null && fx.awayGoals !== null

              return (
                <Link
                  key={fx.id}
                  href={`/fixtures/${fx.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 border-b hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-xs w-28" style={{ color: 'var(--muted)' }}>
                    {formatKickoff(fx.kickoffUtc)}
                  </span>
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <span className="text-sm text-right w-32 text-white truncate">
                      {home?.name ?? `Equipo ${fx.homeTeamId}`}
                    </span>
                    <span
                      className="text-lg font-bold tabular-nums w-16 text-center"
                      style={{ color: hasScore ? 'var(--accent)' : 'var(--muted)' }}
                    >
                      {hasScore ? `${fx.homeGoals} - ${fx.awayGoals}` : 'vs'}
                    </span>
                    <span className="text-sm text-left w-32 text-white truncate">
                      {away?.name ?? `Equipo ${fx.awayTeamId}`}
                    </span>
                  </div>
                  <span
                    className="text-xs w-10 text-right font-bold tracking-wider"
                    style={{ color: statusColor(fx.status) }}
                  >
                    {statusLabel(fx.status)}
                  </span>
                </Link>
              )
            })}
          </div>
        </FadeIn>
      )}
    </div>
  )
}
