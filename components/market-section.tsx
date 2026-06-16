import { ProbabilityBar } from './probability-bar'
import { MarketInfo } from './market-info'
import type { ModelOutput } from '@/lib/types'
import { getMarketCopy, translateOutcome } from '@/lib/content/markets-es'

interface MarketSectionProps {
  title: string
  markets: ModelOutput[]
  topN?: number
  noHeader?: boolean
}

function MarketBlock({ output, topN }: { output: ModelOutput; topN?: number }) {
  const all = Object.entries(output.probabilities).sort(([, a], [, b]) => b - a)
  const entries = topN != null ? all.slice(0, topN) : all

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([key, prob]) => (
        <ProbabilityBar
          key={key}
          label={translateOutcome(output.market, key)}
          probability={prob}
        />
      ))}
    </div>
  )
}

export function MarketSection({ title, markets, topN, noHeader = false }: MarketSectionProps) {
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
              <MarketBlock output={m} topN={topN} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
