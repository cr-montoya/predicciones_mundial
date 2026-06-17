interface ModelRatingBarsProps {
  attackStrength: number
  defenseStrength: number
}

function RatingRow({
  label,
  value,
  barWidth,
  color,
  sublabel,
}: {
  label: string
  value: number
  barWidth: number
  color: string
  sublabel: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', color: '#6b6d75', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#6b6d75' }}>{sublabel}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
            {value.toFixed(2)}
          </span>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${barWidth}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export function ModelRatingBars({ attackStrength, defenseStrength }: ModelRatingBarsProps) {
  const attackBar = Math.min((attackStrength / 2) * 100, 100)
  // defenseStrength < 1 = better defense → invert so high bar = solid defense
  const defenseBar = Math.max(0, Math.min(((2 - defenseStrength) / 2) * 100, 100))

  const attackColor = attackStrength >= 1.0 ? '#FFDB00' : '#6b6d75'
  const defenseColor = defenseStrength <= 1.0 ? '#FFDB00' : '#6b6d75'

  const attackLabel =
    attackStrength >= 1.15 ? 'arriba del promedio' :
    attackStrength <= 0.85 ? 'por debajo del promedio' :
    'promedio'

  const defenseLabel =
    defenseStrength <= 0.85 ? 'sólido' :
    defenseStrength >= 1.15 ? 'por mejorar' :
    'promedio'

  return (
    <div style={{
      background: '#12141a',
      border: '1px solid rgba(255,219,0,0.06)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#6b6d75', textTransform: 'uppercase' }}>
        Rating del modelo
      </span>
      <RatingRow
        label="Ataque"
        value={attackStrength}
        barWidth={attackBar}
        color={attackColor}
        sublabel={attackLabel}
      />
      <RatingRow
        label="Defensa"
        value={defenseStrength}
        barWidth={defenseBar}
        color={defenseColor}
        sublabel={defenseLabel}
      />
      <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
        Promedio = 1.0. En defensa, menor valor = más sólido.
      </p>
    </div>
  )
}
