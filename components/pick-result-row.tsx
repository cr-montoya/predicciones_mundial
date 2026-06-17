import type { PickOutcome } from '@/lib/skills/picks'
import { getFlag } from '@/lib/utils/flags'
import Link from 'next/link'

const OUTCOME_LABEL: Record<PickOutcome, string> = {
  home: 'Local',
  draw: 'Empate',
  away: 'Visitante',
}

interface PickResultRowProps {
  fixtureId: number
  homeTeamName: string
  awayTeamName: string
  status: 'scheduled' | 'live' | 'finished'
  homeGoals: number | null
  awayGoals: number | null
  kickoffUtc: string
  outcome: PickOutcome
  verdict: 'correct' | 'incorrect' | null
}

export function PickResultRow({
  fixtureId,
  homeTeamName,
  awayTeamName,
  status,
  homeGoals,
  awayGoals,
  kickoffUtc,
  outcome,
  verdict,
}: PickResultRowProps) {
  const homeFlag = getFlag(homeTeamName)
  const awayFlag = getFlag(awayTeamName)
  const pickLabel = OUTCOME_LABEL[outcome]

  const isFinished = status === 'finished'
  const isLive = status === 'live'

  const date = new Date(kickoffUtc).toLocaleDateString('es-CO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const verdictColor = verdict === 'correct' ? '#22c55e' : '#ef4444'
  const verdictLabel = verdict === 'correct' ? '✓ Acertaste' : '✗ Fallaste'

  return (
    <Link href={`/fixtures/${fixtureId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        padding: '14px 16px',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.015)',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}>
        {/* Teams + score/date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#f0ece4', fontWeight: 500 }}>
            {homeFlag} {homeTeamName} <span style={{ color: '#6b6d75' }}>vs</span> {awayFlag} {awayTeamName}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>
            {isFinished && homeGoals !== null && awayGoals !== null
              ? `${homeGoals}–${awayGoals}`
              : isLive
              ? <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>EN VIVO</span>
              : date}
          </span>
        </div>

        {/* Pick + verdict */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: '#6b6d75' }}>Mi pick:</span>
          <span style={{ color: '#f0ece4', fontWeight: 600 }}>{pickLabel}</span>
          {verdict && (
            <>
              <span style={{ color: '#4b4d54' }}>·</span>
              <span style={{ color: verdictColor, fontWeight: 700 }}>{verdictLabel}</span>
            </>
          )}
          {!verdict && isLive && (
            <>
              <span style={{ color: '#4b4d54' }}>·</span>
              <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>En juego</span>
            </>
          )}
          {!verdict && status === 'scheduled' && (
            <>
              <span style={{ color: '#4b4d54' }}>·</span>
              <span style={{ color: '#6b6d75' }}>Pendiente</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
