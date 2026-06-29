import Link from 'next/link'
import { loadFixtures } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { getFlag } from '@/lib/utils/flags'
import { PickBadge } from '@/components/pick-badge'
import type { Team } from '@/lib/types'
import { getServerTranslations } from '@/lib/i18n/server'

export const revalidate = 3600

function toBogotaDate(utc: string): string {
  const d = new Date(new Date(utc).getTime() - 5 * 3_600_000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateHeader(dateStr: string, locale: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function formatTime(utc: string, locale: string): string {
  return new Date(utc).toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

export default async function FixturesPage() {
  const [fixtures, { t, locale }] = await Promise.all([
    loadFixtures(),
    getServerTranslations(),
  ])

  const sorted = fixtures.sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
  const teams = buildStaticTeams()
  const teamById = new Map<number, Team>(teams.map((tm) => [tm.id, tm]))

  const fl = t.fixturesList

  function statusStyles(status: string): { bg: string; color: string; label: string } {
    if (status === 'live') return { bg: 'rgba(220,38,38,0.15)', color: '#ef4444', label: fl.statusLive }
    if (status === 'finished') return { bg: 'rgba(2,185,6,0.15)', color: '#02B906', label: fl.statusFinished }
    return { bg: 'rgba(255,219,0,0.06)', color: '#6b6d75', label: fl.statusScheduled }
  }

  const grouped = new Map<string, typeof sorted>()
  for (const fx of sorted) {
    const key = toBogotaDate(fx.kickoffUtc)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(fx)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 60px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#f0ece4', marginBottom: 24 }}>
        {fl.title}
      </div>

      {grouped.size === 0 ? (
        <p style={{ fontSize: 14, color: '#6b6d75' }}>{fl.noFixtures}</p>
      ) : (
        [...grouped.entries()].map(([dateKey, dayFixtures]) => (
          <div key={dateKey} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 12,
              color: '#D4A843',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255,219,0,0.06)',
            }}>
              {formatDateHeader(dateKey, locale)}
            </div>

            {dayFixtures.map((fx) => {
              const home = teamById.get(fx.homeTeamId)
              const away = teamById.get(fx.awayTeamId)
              const hasScore = fx.homeGoals !== null && fx.awayGoals !== null
              const st = statusStyles(fx.status)
              const homeFlag = getFlag(home?.name ?? '')
              const awayFlag = getFlag(away?.name ?? '')

              return (
                <Link
                  key={fx.id}
                  href={`/fixtures/${fx.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: '#6b6d75', fontWeight: 500 }}>
                      {formatTime(fx.kickoffUtc, locale)}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#f0ece4' }}>
                      {home?.name ?? `Equipo ${fx.homeTeamId}`}
                    </span>
                    {homeFlag && <span style={{ fontSize: 20 }}>{homeFlag}</span>}
                  </div>

                  <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: hasScore ? '#FFDB00' : '#6b6d75',
                    }}>
                      {hasScore ? `${fx.homeGoals} - ${fx.awayGoals}` : 'vs'}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {awayFlag && <span style={{ fontSize: 20 }}>{awayFlag}</span>}
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#f0ece4' }}>
                      {away?.name ?? `Equipo ${fx.awayTeamId}`}
                    </span>
                  </div>

                  <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{
                      background: st.bg,
                      color: st.color,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 4,
                      letterSpacing: '0.5px',
                    }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ width: 44, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <PickBadge fixtureId={fx.id} />
                  </div>
                </Link>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
