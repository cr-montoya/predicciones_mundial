import Link from 'next/link'
import type { FixtureWithTeams } from '@/lib/agents/home-types'
import { getFlag } from '@/lib/utils/flags'

interface FixturesTodayProps {
  fixtures: FixtureWithTeams[]
}

function formatTime(utc: string): string {
  return new Date(utc).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

function statusStyles(status: string): { bg: string; color: string; label: string } {
  if (status === 'live') return { bg: 'rgba(220,38,38,0.15)', color: '#ef4444', label: 'EN VIVO' }
  if (status === 'finished') return { bg: 'rgba(2,185,6,0.15)', color: '#02B906', label: 'FIN' }
  return { bg: 'rgba(255,219,0,0.08)', color: '#D4A843', label: 'PROG' }
}

export function FixturesToday({ fixtures }: FixturesTodayProps) {
  if (fixtures.length === 0) return null

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 11,
        color: '#6b6d75',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        Partidos
      </div>

      {fixtures.map(({ fixture, homeTeam, awayTeam, prediction }) => {
        const st = statusStyles(fixture.status)
        const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null
        const homeFlag = getFlag(homeTeam?.name ?? '')
        const awayFlag = getFlag(awayTeam?.name ?? '')
        const pct = prediction ? Math.round(prediction.winnerProb * 100) : null

        return (
          <Link
            key={fixture.id}
            href={`/fixtures/${fixture.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              textDecoration: 'none',
            }}
          >
            <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f0ece4' }}>
                {formatTime(fixture.kickoffUtc)}
              </span>
            </div>

            <div style={{ width: 52, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{
                background: st.bg,
                color: st.color,
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                letterSpacing: '1px',
              }}>
                {st.label}
              </span>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}>
              {homeFlag && <span style={{ fontSize: 22 }}>{homeFlag}</span>}
              <span style={{ fontSize: 15, fontWeight: 500, color: '#f0ece4' }}>
                {homeTeam?.name ?? `Equipo ${fixture.homeTeamId}`}
              </span>
              <span style={{ fontSize: 13, color: '#6b6d75' }}>vs</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#f0ece4' }}>
                {awayTeam?.name ?? `Equipo ${fixture.awayTeamId}`}
              </span>
              {awayFlag && <span style={{ fontSize: 22 }}>{awayFlag}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
              {hasScore ? (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#FFDB00' }}>
                    {fixture.homeGoals} - {fixture.awayGoals}
                  </span>
                </div>
              ) : prediction && pct !== null ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
                    {prediction.winner} {pct}%
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {prediction.expectedGoals} goles esperados
                  </div>
                </div>
              ) : null}
              <div style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,219,0,0.06)',
                borderRadius: 6,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, color: '#D4A843' }}>→</span>
              </div>
            </div>
          </Link>
        )
      })}
    </section>
  )
}
