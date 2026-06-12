import { sanityCheck } from '@/lib/types'
import type { ModelOutput, MarketType } from '@/lib/types'

export interface RankableMarket {
  fixtureId: number
  fixtureLabel: string
  output: ModelOutput
}

export interface RankedMarket {
  fixtureId: number
  fixtureLabel: string
  market: MarketType
  topOutcome: string
  topProbability: number
  interestScore: number
  confidence: ModelOutput['confidence']
  computedAt: string
}

const OU_MARKETS = new Set<MarketType>([
  'over_under_goals_1_5',
  'over_under_goals_2_5',
  'over_under_goals_3_5',
])

export function shannonEntropy(probs: number[]): number {
  return probs.reduce((acc, p) => {
    if (p <= 0) return acc
    return acc - p * Math.log(p)
  }, 0)
}

export function normalizedEntropy(probs: number[]): number {
  const k = probs.filter((p) => p > 0).length
  if (k <= 1) return 0
  const maxH = Math.log(k)
  if (maxH === 0) return 0
  return shannonEntropy(probs) / maxH
}

export function interestScore(probs: number[]): number {
  const pMax = Math.max(...probs)
  return pMax * (1 - normalizedEntropy(probs))
}

interface RankOptions {
  limit?: number
  maxPerFixture?: number
}

export function rankMarkets(
  markets: RankableMarket[],
  opts: RankOptions = {}
): RankedMarket[] {
  const { limit = 10, maxPerFixture = 2 } = opts

  for (const m of markets) {
    sanityCheck(m.output)
  }

  const scored = markets.map((m): RankedMarket & { _score: number } => {
    const probs = Object.values(m.output.probabilities)
    const score = interestScore(probs)
    const [topOutcome, topProbability] = Object.entries(m.output.probabilities).reduce(
      (best, [key, p]) => (p > best[1] ? [key, p] : best),
      ['', 0] as [string, number]
    )
    return {
      fixtureId: m.fixtureId,
      fixtureLabel: m.fixtureLabel,
      market: m.output.market,
      topOutcome,
      topProbability,
      interestScore: score,
      confidence: m.output.confidence,
      computedAt: m.output.computedAt,
      _score: score,
    }
  })

  scored.sort((a, b) => {
    if (Math.abs(b._score - a._score) > 1e-9) return b._score - a._score
    if (Math.abs(b.topProbability - a.topProbability) > 1e-9)
      return b.topProbability - a.topProbability
    return a.fixtureId - b.fixtureId
  })

  const fixtureCount = new Map<number, number>()
  const ouSeenPerFixture = new Set<number>()
  const result: RankedMarket[] = []

  for (const item of scored) {
    if (result.length >= limit) break

    const count = fixtureCount.get(item.fixtureId) ?? 0
    if (count >= maxPerFixture) continue

    if (OU_MARKETS.has(item.market)) {
      if (ouSeenPerFixture.has(item.fixtureId)) continue
      ouSeenPerFixture.add(item.fixtureId)
    }

    fixtureCount.set(item.fixtureId, count + 1)

    const { _score: _ignored, ...ranked } = item
    void _ignored
    result.push(ranked)
  }

  return result
}
