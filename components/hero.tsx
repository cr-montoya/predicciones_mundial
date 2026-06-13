import type { FixtureWithTeams } from '@/lib/agents/home-types'

interface HeroProps {
  fixturesToday: FixtureWithTeams[]
  fallbackLabel: string | null
}

function formatKickoffLocal(utc: string): string {
  return new Date(utc).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

function formatDate(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).toUpperCase()
}

export function Hero({ fixturesToday, fallbackLabel }: HeroProps) {
  const count = fixturesToday.length
  const first = fixturesToday[0]?.fixture

  return (
    <div className="border-b py-10 px-6" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-1 font-bold tracking-widest"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              borderRadius: '2px',
            }}
          >
            FIFA WORLD CUP
          </span>
          <span className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
            {formatDate()}
          </span>
        </div>
        {fallbackLabel ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
              SIN PARTIDOS HOY
            </span>
            <span
              className="text-2xl font-bold tracking-widest"
              style={{ color: 'var(--accent)' }}
            >
              {fallbackLabel.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <span
              className="font-bold tabular-nums"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--accent)', lineHeight: 1 }}
            >
              {count}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold tracking-widest text-white">
                {count === 1 ? 'PARTIDO HOY' : 'PARTIDOS HOY'}
              </span>
              {first && (
                <span className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
                  PRIMERO A LAS {formatKickoffLocal(first.kickoffUtc)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
