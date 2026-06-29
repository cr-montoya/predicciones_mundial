'use client'

import type { FixtureWithTeams } from '@/lib/agents/home-types'
import { useTranslation } from '@/lib/i18n/hook'

interface HeroProps {
  fixturesToday: FixtureWithTeams[]
  fallbackLabel: string | null
}

function formatKickoff(utc: string, locale: string): string {
  return new Date(utc).toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  })
}

export function Hero({ fixturesToday, fallbackLabel }: HeroProps) {
  const { t, locale } = useTranslation()
  const count = fixturesToday.length
  const first = fixturesToday[0]?.fixture
  const dateStr = formatDate(locale)
  const firstKickoff = first ? formatKickoff(first.kickoffUtc, locale) : null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 24,
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <div>
        <div style={{
          fontSize: 12,
          color: '#D4A843',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 6,
        }}>
          FIFA World Cup
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f0ece4' }}>
          {fallbackLabel ?? t.hero.defaultTitle}
        </div>
        <div style={{ fontSize: 13, color: '#6b6d75', marginTop: 4 }}>
          {dateStr}
          {!fallbackLabel && firstKickoff && (
            <> · {t.hero.firstMatchAt} {firstKickoff}</>
          )}
        </div>
      </div>

      {!fallbackLabel && count > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,219,0,0.08)',
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid rgba(255,219,0,0.12)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#FFDB00', lineHeight: 1 }}>
            {count}
          </span>
          <span style={{
            fontSize: 12,
            color: '#D4A843',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 600,
          }}>
            {count === 1 ? t.hero.match : t.hero.matches}
          </span>
        </div>
      )}
    </div>
  )
}
