import { resolveModelVerdict, deriveActualOutcome, topModelCall } from '@/lib/skills/accuracy'

const OUTCOME_LABEL: Record<string, string> = {
  home: 'Local',
  draw: 'Empate',
  away: 'Visita',
}

interface ModelResultCardProps {
  homeName: string
  awayName: string
  homeGoals: number
  awayGoals: number
  probabilities: Record<string, number>
}

export function ModelResultCard({
  homeName,
  awayName,
  homeGoals,
  awayGoals,
  probabilities,
}: ModelResultCardProps) {
  const verdict = resolveModelVerdict(probabilities, homeGoals, awayGoals)
  const modelCall = topModelCall(probabilities)
  const actual = deriveActualOutcome(homeGoals, awayGoals)

  const verdictLabel =
    verdict === 'correct' ? '✓ ACERTÓ' : verdict === 'incorrect' ? '✗ FALLÓ' : null
  const verdictColor = verdict === 'correct' ? '#22c55e' : '#ef4444'

  const sorted = Object.entries(probabilities)
    .filter(([k]) => k === 'home' || k === 'draw' || k === 'away')
    .sort(([, a], [, b]) => b - a)

  const topProb = sorted[0]?.[1] ?? 1

  const rowLabel = (key: string) => {
    if (key === 'home') return homeName
    if (key === 'away') return awayName
    return 'Empate'
  }

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '16px 20px',
      background: 'rgba(255,255,255,0.02)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: '#6b6d75',
        }}>
          PREDICCIÓN DE LA IA
        </span>
        {verdictLabel && (
          <span style={{ fontSize: 11, fontWeight: 700, color: verdictColor, letterSpacing: '1px' }}>
            {verdictLabel}
          </span>
        )}
      </div>

      {/* Probability rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {sorted.map(([key, prob]) => {
          const isTop = key === modelCall
          const pct = Math.round(prob * 100)
          const barWidth = `${Math.round((prob / topProb) * 100)}%`
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 12,
                color: isTop ? '#f0ece4' : '#6b6d75',
                fontWeight: isTop ? 600 : 400,
                width: 90,
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {rowLabel(key)}
              </span>
              <div style={{
                flex: 1,
                height: 4,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: barWidth,
                  height: '100%',
                  background: isTop ? '#FFDB00' : 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                }} />
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: isTop ? 700 : 400,
                color: isTop ? '#FFDB00' : '#6b6d75',
                width: 36,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Result summary */}
      <div style={{ fontSize: 12, color: '#6b6d75' }}>
        Resultado real:{' '}
        <span style={{ color: '#f0ece4', fontWeight: 600 }}>
          {homeGoals}–{awayGoals}
        </span>
        {' '}·{' '}
        <span style={{ color: verdict === 'correct' ? '#22c55e' : '#9ca3af' }}>
          {actual === 'draw' ? 'Empate' : `${OUTCOME_LABEL[actual] ?? actual} ganó`}
        </span>
        {verdict === 'incorrect' && modelCall && (
          <span style={{ color: '#6b6d75' }}>
            {' '}(la IA predijo {OUTCOME_LABEL[modelCall] ?? modelCall})
          </span>
        )}
      </div>
    </div>
  )
}
