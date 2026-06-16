import type { Team, ModelOutput } from '@/lib/types'
import type { BracketRound } from '@/lib/skills/bracket'
import { BracketMatchup } from './bracket-matchup'

interface BracketViewProps {
  rounds: BracketRound[]
  teamMap: Map<number, Team>
  predictionMap: Map<number, ModelOutput>
}

export function BracketView({ rounds, teamMap, predictionMap }: BracketViewProps) {
  if (rounds.length === 0) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
        color: '#6b6d75',
        fontSize: 14,
      }}>
        Los cruces de eliminatorias se mostrarán cuando finalice la fase de grupos.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {rounds.map(round => (
        <section key={round.key}>
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
            {round.label}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {round.fixtures.map(fixture => (
              <BracketMatchup
                key={fixture.id}
                fixture={fixture}
                homeTeam={teamMap.get(fixture.homeTeamId)}
                awayTeam={teamMap.get(fixture.awayTeamId)}
                prediction={predictionMap.get(fixture.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
