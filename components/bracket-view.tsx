import type { ResolvedMatchup } from './bracket-matchup'
import { BracketMatchup } from './bracket-matchup'

interface BracketViewProps {
  matchups: ResolvedMatchup[]
}

export function BracketView({ matchups }: BracketViewProps) {
  if (matchups.length === 0) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
        color: '#6b6d75',
        fontSize: 14,
      }}>
        Los cruces se mostrarán cuando haya partidos jugados.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <section>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#6b6d75',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          Ronda de 32
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {matchups.map(m => (
            <BracketMatchup key={m.matchId} {...m} />
          ))}
        </div>
      </section>

      <div style={{
        padding: '20px 24px',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 10,
        color: '#6b6d75',
        fontSize: 12,
        lineHeight: 1.6,
      }}>
        Los cruces de Octavos, Cuartos, Semifinales y Final se irán completando conforme avance el torneo.
        Las probabilidades en cruces <span style={{ color: '#FFDB00', opacity: 0.8 }}>PROYECTADO</span> reflejan las standings actuales de grupos.
      </div>
    </div>
  )
}
