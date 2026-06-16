import type { AccuracyStats } from '@/lib/skills/accuracy'

const MIN_MATCHES = 3

interface AccuracyWidgetProps {
  stats: AccuracyStats
}

export function AccuracyWidget({ stats }: AccuracyWidgetProps) {
  if (stats.total < MIN_MATCHES) return null

  const barWidth = `${stats.pct}%`

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 11,
        color: '#6b6d75',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        Precisión del Modelo
      </div>

      <div style={{
        background: 'rgba(255,219,0,0.02)',
        border: '1px solid rgba(255,219,0,0.06)',
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: '#9ca3af' }}>
            {stats.correct} / {stats.total} partidos
          </span>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#FFDB00', letterSpacing: '-1px' }}>
            {stats.pct}%
          </span>
        </div>

        <div style={{
          height: 6,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          <div style={{
            width: barWidth,
            height: '100%',
            background: '#FFDB00',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        </div>

        <p style={{ fontSize: 11, color: '#6b6d75', margin: 0 }}>
          Resultado 1X2 · Solo partidos finalizados
        </p>
      </div>
    </section>
  )
}
