import type { ResolvedMatchup } from './bracket-matchup'
import { BracketTree } from './bracket-tree'

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
    <div>
      <BracketTree matchups={matchups} />
      <div style={{
        marginTop: 24,
        fontSize: 11,
        color: '#4b4d54',
        lineHeight: 1.6,
      }}>
        Proyecciones basadas en standings actuales · Octavos en adelante se confirman al cerrar la fase de grupos · Probabilidades a 90 min
      </div>
    </div>
  )
}
