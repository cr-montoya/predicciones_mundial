import type { OddsResult } from '@/lib/agents/odds-loader'
import type { ValueOutput } from '@/lib/model/skills/value-calc'

type OddsField = 'homeWin' | 'draw' | 'awayWin' | 'over25' | 'under25'

interface MarketReferenceProps {
  market: 'result_1x2' | 'over_under_goals_2_5'
  outcomeKey: string
  odds: OddsResult
  value: ValueOutput | null
}

const OUTCOME_FIELD_MAP: Record<string, Record<string, OddsField>> = {
  result_1x2: { home: 'homeWin', draw: 'draw', away: 'awayWin' },
  over_under_goals_2_5: { over: 'over25', under: 'under25' },
}

const LABEL_STYLES: Record<string, React.CSSProperties> = {
  'VALOR+': {
    background: 'rgba(255,219,0,0.12)',
    color: '#FFDB00',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 3,
    letterSpacing: 1,
  },
  'VALOR-': {
    background: 'rgba(212,168,67,0.10)',
    color: '#D4A843',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 3,
    letterSpacing: 1,
  },
  'NEUTRO': {
    background: 'rgba(255,255,255,0.06)',
    color: '#6b6d75',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 3,
    letterSpacing: 1,
  },
}

const EMPTY = <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin referencia de mercado</p>

export function MarketReference({ market, outcomeKey, odds, value }: MarketReferenceProps) {
  if (!odds) return EMPTY

  const field = OUTCOME_FIELD_MAP[market]?.[outcomeKey]
  if (!field) return EMPTY

  const marketProbability = odds[field]
  if (marketProbability === null || marketProbability === undefined) return EMPTY

  if (!value) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
        <span className="text-xs tabular-nums" style={{ color: '#9a9ca3' }}>
          Mercado {Math.round(marketProbability * 100)}%
        </span>
      </div>
    )
  }

  const { diff, label } = value
  const diffDisplay = diff >= 0 ? `+${Math.round(diff * 100)}` : `${Math.round(diff * 100)}`

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
      <span className="text-xs tabular-nums" style={{ color: '#9a9ca3' }}>
        Mercado {Math.round(marketProbability * 100)}%
      </span>
      <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
        · IA {diffDisplay} pp
      </span>
      {odds.bookmakerCount >= 2 && (
        <span style={LABEL_STYLES[label]}>
          {label}
        </span>
      )}
    </div>
  )
}
