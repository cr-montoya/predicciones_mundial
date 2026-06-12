import { ProbabilityBar } from './probability-bar'
import type { ModelOutput } from '@/lib/types'

interface MarketSectionProps {
  title: string
  markets: ModelOutput[]
  topN?: number
}

function MarketBlock({ output, topN }: { output: ModelOutput; topN?: number }) {
  const all = Object.entries(output.probabilities).sort(([, a], [, b]) => b - a)
  const entries = topN != null ? all.slice(0, topN) : all

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([key, prob]) => (
        <ProbabilityBar key={key} label={key} probability={prob} />
      ))}
    </div>
  )
}

export function MarketSection({ title, markets, topN }: MarketSectionProps) {
  if (markets.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <h2
        className="text-xs tracking-widest font-bold border-b pb-2"
        style={{ color: 'var(--accent)', borderColor: 'var(--border)' }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {markets.map((m, i) => (
          <div key={`${m.market}-${i}`} className="flex flex-col gap-3">
            <h3 className="text-xs tracking-wider" style={{ color: 'var(--muted)' }}>
              {m.market.replace(/_/g, ' ').toUpperCase()}
            </h3>
            <MarketBlock output={m} topN={topN} />
          </div>
        ))}
      </div>
    </div>
  )
}
