import { ProbabilityBar } from './probability-bar'
import { MarketInfo } from './market-info'
import { getMarketCopy, translateOutcome } from '@/lib/content/markets-es'
import type { ModelOutput } from '@/lib/types'

interface TeamTotalsSectionProps {
  homeMarkets: ModelOutput[]
  awayMarkets: ModelOutput[]
  homeName: string
  awayName: string
  lambdaHome: number
  lambdaAway: number
}

interface TeamColumnProps {
  name: string
  lambda: number
  markets: ModelOutput[]
}

function TeamColumn({ name, lambda, markets }: TeamColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--muted)' }}>
          {name}
        </span>
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {lambda.toFixed(1)}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>xG esperados</span>
      </div>
      <div className="flex flex-col gap-4">
        {markets.map((m) => {
          const copy = getMarketCopy(m.market)
          const entries = Object.entries(m.probabilities).sort(([, a], [, b]) => b - a)
          return (
            <div key={m.market} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs tracking-wider" style={{ color: 'var(--muted)' }}>
                  {copy?.shortLabel ?? m.market.replace(/_/g, ' ').toUpperCase()}
                </span>
                {copy && <MarketInfo copy={copy} />}
              </div>
              <div className="flex flex-col gap-2">
                {entries.map(([key, prob]) => (
                  <ProbabilityBar
                    key={key}
                    label={translateOutcome(m.market, key)}
                    probability={prob}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TeamTotalsSection({
  homeMarkets,
  awayMarkets,
  homeName,
  awayName,
  lambdaHome,
  lambdaAway,
}: TeamTotalsSectionProps) {
  if (homeMarkets.length === 0 && awayMarkets.length === 0) return null

  return (
    <div className="flex flex-col gap-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TeamColumn name={homeName} lambda={lambdaHome} markets={homeMarkets} />
        <div className="block md:hidden h-px" style={{ background: 'var(--border)' }} />
        <TeamColumn name={awayName} lambda={lambdaAway} markets={awayMarkets} />
      </div>
    </div>
  )
}
