import type { ResolvedMatchup } from './bracket-matchup'
import { BracketTree } from './bracket-tree'

interface BracketViewProps {
  matchups: ResolvedMatchup[]
  emptyState: string
}

export function BracketView({ matchups, emptyState }: BracketViewProps) {
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
        {emptyState}
      </div>
    )
  }

  return (
    <div>
      <BracketTree matchups={matchups} />
    </div>
  )
}
