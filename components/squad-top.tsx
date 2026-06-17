import type { Player } from '@/lib/types'

interface SquadTopProps {
  players: Player[]
  teamName: string
}

const POS_LABEL: Record<string, string> = { FW: 'Delantero', MF: 'Mediocampista', DF: 'Defensa', GK: 'Portero' }

export function SquadTop({ players, teamName }: SquadTopProps) {
  const top = players
    .filter(p => (p.position === 'FW' || p.position === 'MF') && (p.goalsPerMinute ?? 0) > 0)
    .sort((a, b) => (b.goalsPerMinute ?? 0) - (a.goalsPerMinute ?? 0))
    .slice(0, 8)

  if (top.length === 0) return null

  const maxRate = top[0].goalsPerMinute ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#6b6d75', textTransform: 'uppercase' }}>
        Jugadores destacados · {teamName}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {top.map((p, i) => {
          const gpm = p.goalsPerMinute ?? 0
          const barPct = maxRate > 0 ? (gpm / maxRate) * 100 : 0
          const per90 = p.minutesPlayed > 0 ? (gpm * 90).toFixed(2) : '0.00'
          return (
            <div
              key={p.id}
              style={{
                background: '#12141a',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12, color: '#555', width: 16, textAlign: 'right', flexShrink: 0 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f0ece4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FFDB00', flexShrink: 0, marginLeft: 8 }}>
                    {per90} <span style={{ fontSize: 10, fontWeight: 400, color: '#6b6d75' }}>goles/90</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#6b6d75', flexShrink: 0 }}>
                    {POS_LABEL[p.position] ?? p.position}
                  </span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${barPct}%`, height: '100%', background: 'rgba(255,219,0,0.4)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
