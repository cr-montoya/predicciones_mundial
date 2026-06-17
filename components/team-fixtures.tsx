import Link from 'next/link'
import { getFlag } from '@/lib/utils/flags'
import type { Fixture, ModelOutput } from '@/lib/types'

interface TeamFixture {
  fixture: Fixture
  rivalName: string
  rivalId: number
  isHome: boolean
  prediction?: ModelOutput
}

interface TeamFixturesProps {
  fixtures: TeamFixture[]
  teamName: string
}

function kickoffLabel(utc: string) {
  return new Date(utc).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

function WDLBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const map = {
    W: { label: 'G', color: '#02B906', bg: 'rgba(2,185,6,0.12)' },
    D: { label: 'E', color: '#6b6d75', bg: 'rgba(107,109,117,0.12)' },
    L: { label: 'P', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  }
  const { label, color, bg } = map[result]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 22,
      height: 22,
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      color,
      background: bg,
    }}>
      {label}
    </span>
  )
}

function getResult(fixture: Fixture, isHome: boolean): 'W' | 'D' | 'L' | null {
  if (fixture.homeGoals === null || fixture.awayGoals === null) return null
  const scored = isHome ? fixture.homeGoals : fixture.awayGoals
  const conceded = isHome ? fixture.awayGoals : fixture.homeGoals
  if (scored > conceded) return 'W'
  if (scored < conceded) return 'L'
  return 'D'
}

export function TeamFixtures({ fixtures, teamName }: TeamFixturesProps) {
  if (fixtures.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#6b6d75' }}>Sin partidos registrados para {teamName}.</p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#6b6d75', textTransform: 'uppercase' }}>
        Partidos del torneo
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {fixtures.map(({ fixture, rivalName, rivalId, isHome, prediction }) => {
          const flag = getFlag(rivalName)
          const result = fixture.status === 'finished' ? getResult(fixture, isHome) : null
          const score = fixture.homeGoals !== null && fixture.awayGoals !== null
            ? isHome
              ? `${fixture.homeGoals}–${fixture.awayGoals}`
              : `${fixture.awayGoals}–${fixture.homeGoals}`
            : null

          const r1x2 = prediction
          const topOutcome = r1x2
            ? Object.entries(r1x2.probabilities).sort(([, a], [, b]) => b - a)[0]
            : null
          const predLabel = topOutcome
            ? topOutcome[0] === 'home'
              ? isHome ? 'Gana local' : 'Gana visitante'
              : topOutcome[0] === 'away'
              ? isHome ? 'Gana visitante' : 'Gana local'
              : 'Empate'
            : null
          const predPct = topOutcome ? Math.round(topOutcome[1] * 100) : null

          return (
            <Link
              key={fixture.id}
              href={`/fixtures/${fixture.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: '#12141a',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}>
                <span style={{ fontSize: 11, color: '#6b6d75', width: 100, flexShrink: 0 }}>
                  {kickoffLabel(fixture.kickoffUtc)}
                </span>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: '#6b6d75', flexShrink: 0 }}>
                    {isHome ? 'vs' : 'en'}
                  </span>
                  {flag && <span style={{ fontSize: 15, flexShrink: 0 }}>{flag}</span>}
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: '#f0ece4',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {rivalName}
                  </span>
                </div>

                {fixture.status === 'finished' && score && result ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f0ece4', fontVariantNumeric: 'tabular-nums' }}>
                      {score}
                    </span>
                    <WDLBadge result={result} />
                  </div>
                ) : predLabel && predPct !== null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#6b6d75' }}>{predLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFDB00' }}>{predPct}%</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>Por definir</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
