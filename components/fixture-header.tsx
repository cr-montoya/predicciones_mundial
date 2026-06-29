'use client'

import { useTranslation } from '@/lib/i18n/hook'

interface FixtureHeaderProps {
  home: string
  homeId: number
  away: string
  awayId: number
  kickoff: string
  homeGoals: number | null
  awayGoals: number | null
  status: string
}

export function FixtureHeader({ home, homeId, away, awayId, kickoff, homeGoals, awayGoals, status }: FixtureHeaderProps) {
  const { t, locale } = useTranslation()
  const hasScore = homeGoals !== null && awayGoals !== null

  const date = new Date(kickoff).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })

  const statusLabel = status === 'finished'
    ? t.fixtureDetail.status.finished
    : status === 'live'
    ? t.fixtureDetail.status.live
    : t.fixtureDetail.status.scheduled

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs tracking-wider" style={{ color: 'var(--muted)' }}>{date}</p>
      <div className="flex items-center gap-6">
        <a href={`/teams/${homeId}`} className="text-xl font-bold flex-1 text-right" style={{ color: '#f0ece4', textDecoration: 'none' }}>
          {home}
        </a>
        <span
          className="text-4xl font-bold tabular-nums w-28 text-center"
          style={{ color: hasScore ? 'var(--accent)' : 'var(--muted)' }}
        >
          {hasScore ? `${homeGoals} - ${awayGoals}` : 'vs'}
        </span>
        <a href={`/teams/${awayId}`} className="text-xl font-bold flex-1" style={{ color: '#f0ece4', textDecoration: 'none' }}>
          {away}
        </a>
      </div>
      <p className="text-xs tracking-widest text-center" style={{ color: 'var(--muted)' }}>
        {statusLabel}
      </p>
    </div>
  )
}
