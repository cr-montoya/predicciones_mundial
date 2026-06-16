import { ProbabilityBar } from './probability-bar'
import { MarketInfo } from './market-info'
import { MarketReference } from './market-reference'
import type { ModelOutput } from '@/lib/types'
import type { OddsResult } from '@/lib/agents/odds-loader'
import type { ValueOutput } from '@/lib/model/skills/value-calc'
import { getMarketCopy, translateOutcome } from '@/lib/content/markets-es'

interface MarketSectionProps {
  title: string
  markets: ModelOutput[]
  topN?: number
  noHeader?: boolean
  odds?: OddsResult
  valueMap?: Record<string, Record<string, ValueOutput>> | null
}

const MVP_MARKETS = new Set(['result_1x2', 'over_under_goals_2_5'])

function MarketBlock({
  output,
  topN,
  odds,
  valueMap,
}: {
  output: ModelOutput
  topN?: number
  odds?: OddsResult
  valueMap?: Record<string, Record<string, ValueOutput>> | null
}) {
  const all = Object.entries(output.probabilities).sort(([, a], [, b]) => b - a)
  const entries = topN != null ? all.slice(0, topN) : all
  const isMvpMarket = MVP_MARKETS.has(output.market)
  const showReference = odds !== undefined && isMvpMarket

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([key, prob]) => (
        <div key={key} className="flex flex-col">
          <ProbabilityBar
            label={translateOutcome(output.market, key)}
            probability={prob}
          />
          {showReference && (
            <MarketReference
              market={output.market as 'result_1x2' | 'over_under_goals_2_5'}
              outcomeKey={key}
              odds={odds}
              value={valueMap?.[output.market]?.[key] ?? null}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function MarketSection({ title, markets, topN, noHeader = false, odds, valueMap }: MarketSectionProps) {
  if (markets.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      {!noHeader && (
        <h2
          className="text-xs tracking-widest font-bold border-b pb-2"
          style={{ color: 'var(--accent)', borderColor: 'var(--border)' }}
        >
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {markets.map((m, i) => {
          const copy = getMarketCopy(m.market)
          return (
            <div key={`${m.market}-${i}`} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-xs tracking-wider" style={{ color: 'var(--muted)' }}>
                  {copy?.shortLabel ?? m.market.replace(/_/g, ' ').toUpperCase()}
                </h3>
                {copy && <MarketInfo copy={copy} />}
              </div>
              <MarketBlock output={m} topN={topN} odds={odds} valueMap={valueMap} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
