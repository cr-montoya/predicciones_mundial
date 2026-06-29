'use client'

import { useTranslation } from '@/lib/i18n/hook'

interface LastUpdatedProps {
  generatedAt: string
}

function formatRelative(isoString: string, t: { label: string; ago: string; justNow: string; minutes: (n: number) => string; hours: (n: number) => string }, locale: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return t.justNow
  if (diffMin < 60) return `${t.ago} ${t.minutes(diffMin)}`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${t.ago} ${t.hours(diffHours)}`

  const d = new Date(isoString)
  return d.toLocaleString(locale === 'en' ? 'en-US' : 'es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LastUpdated({ generatedAt }: LastUpdatedProps) {
  const { t, locale } = useTranslation()
  const relative = formatRelative(generatedAt, t.lastUpdated, locale)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
      <div style={{
        width: 6,
        height: 6,
        background: '#02B906',
        borderRadius: '50%',
        animation: 'pulseGlow 2s infinite',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 11, color: '#555' }}>
        {t.lastUpdated.label} {relative}
      </span>
    </div>
  )
}
