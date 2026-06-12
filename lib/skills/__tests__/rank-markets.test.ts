import { describe, it, expect } from 'vitest'
import {
  shannonEntropy,
  normalizedEntropy,
  interestScore,
  rankMarkets,
} from '@/lib/skills/rank-markets'
import type { RankableMarket } from '@/lib/skills/rank-markets'
import type { ModelOutput } from '@/lib/types'

function makeOutput(
  market: ModelOutput['market'],
  probs: Record<string, number>,
  confidence: ModelOutput['confidence'] = 'medium'
): ModelOutput {
  return {
    market,
    probabilities: probs,
    confidence,
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
}

function makeMarket(
  fixtureId: number,
  output: ModelOutput,
  label?: string
): RankableMarket {
  return {
    fixtureId,
    fixtureLabel: label ?? `Team${fixtureId}A vs Team${fixtureId}B`,
    output,
  }
}

describe('shannonEntropy', () => {
  it('distribucion degenerada (pMax=1): entropia es 0', () => {
    expect(shannonEntropy([1, 0, 0])).toBeCloseTo(0, 10)
  })

  it('uniforme k=3: entropia es ln(3)', () => {
    const p = 1 / 3
    expect(shannonEntropy([p, p, p])).toBeCloseTo(Math.log(3), 8)
  })

  it('trata 0*log0 como 0 sin NaN', () => {
    const h = shannonEntropy([0.5, 0.5, 0])
    expect(Number.isNaN(h)).toBe(false)
    expect(h).toBeCloseTo(Math.log(2), 8)
  })
})

describe('normalizedEntropy', () => {
  it('k=1: normalizedEntropy es 0', () => {
    expect(normalizedEntropy([1])).toBe(0)
  })

  it('distribucion degenerada [1, 0, 0]: normalizedEntropy es 0', () => {
    expect(normalizedEntropy([1, 0, 0])).toBe(0)
  })

  it('uniforme k=3: normalizedEntropy es 1.0', () => {
    const p = 1 / 3
    expect(normalizedEntropy([p, p, p])).toBeCloseTo(1.0, 8)
  })

  it('uniforme k=2: normalizedEntropy es 1.0', () => {
    expect(normalizedEntropy([0.5, 0.5])).toBeCloseTo(1.0, 8)
  })
})

describe('interestScore', () => {
  it('distribucion degenerada: score igual a pMax (1.0)', () => {
    expect(interestScore([1, 0, 0])).toBeCloseTo(1.0, 8)
  })

  it('uniforme k=3: score es 0 porque normalizedEntropy=1', () => {
    const p = 1 / 3
    expect(interestScore([p, p, p])).toBeCloseTo(0, 8)
  })

  it('sesgo moderado: score entre 0 y pMax', () => {
    const probs = [0.6, 0.25, 0.15]
    const score = interestScore(probs)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(0.6)
  })
})

describe('rankMarkets - validacion de suma', () => {
  it('lanza si probabilities no suman 1.0 +/-0.001', () => {
    const badOutput = makeOutput('result_1x2', { home: 0.5, draw: 0.2, away: 0.1 })
    expect(() =>
      rankMarkets([makeMarket(1, badOutput)])
    ).toThrow()
  })
})

describe('rankMarkets - desempate estable', () => {
  it('misma score: desempata por topProbability desc, luego fixtureId asc', () => {
    const outp1 = makeOutput('result_1x2', { home: 0.5, draw: 0.3, away: 0.2 })
    const outp2 = makeOutput('result_1x2', { home: 0.5, draw: 0.3, away: 0.2 })
    const outp3 = makeOutput('result_1x2', { home: 0.55, draw: 0.25, away: 0.2 })

    const markets: RankableMarket[] = [
      makeMarket(3, outp1),
      makeMarket(1, outp2),
      makeMarket(2, outp3),
    ]
    const ranked = rankMarkets(markets, { limit: 3, maxPerFixture: 3 })

    expect(ranked[0].fixtureId).toBe(2)
    expect(ranked[1].fixtureId).toBe(1)
    expect(ranked[2].fixtureId).toBe(3)
  })
})

describe('rankMarkets - cap de familia O/U', () => {
  it('solo acepta 1 mercado O/U por fixture aunque haya 3 disponibles', () => {
    const m15 = makeOutput('over_under_goals_1_5', { over: 0.75, under: 0.25 })
    const m25 = makeOutput('over_under_goals_2_5', { over: 0.60, under: 0.40 })
    const m35 = makeOutput('over_under_goals_3_5', { over: 0.45, under: 0.55 })
    const other = makeOutput('btts', { yes: 0.55, no: 0.45 })

    const markets: RankableMarket[] = [
      makeMarket(1, m15, 'A vs B'),
      makeMarket(1, m25, 'A vs B'),
      makeMarket(1, m35, 'A vs B'),
      makeMarket(1, other, 'A vs B'),
    ]

    const ranked = rankMarkets(markets, { limit: 10, maxPerFixture: 4 })
    const ouMarkets = ranked.filter(
      (r) =>
        r.market === 'over_under_goals_1_5' ||
        r.market === 'over_under_goals_2_5' ||
        r.market === 'over_under_goals_3_5'
    )
    expect(ouMarkets.length).toBe(1)
  })
})

describe('rankMarkets - maxPerFixture', () => {
  it('no emite mas de maxPerFixture mercados por fixture', () => {
    const outputs: ModelOutput[] = [
      makeOutput('result_1x2', { home: 0.5, draw: 0.3, away: 0.2 }),
      makeOutput('btts', { yes: 0.55, no: 0.45 }),
      makeOutput('exact_score', { '1-0': 0.15, '0-0': 0.10, '2-1': 0.10, '1-1': 0.08, '0-1': 0.07, other: 0.50 }),
    ]
    const markets = outputs.map((o) => makeMarket(1, o, 'A vs B'))
    const ranked = rankMarkets(markets, { limit: 10, maxPerFixture: 2 })
    const fromFixture1 = ranked.filter((r) => r.fixtureId === 1)
    expect(fromFixture1.length).toBeLessThanOrEqual(2)
  })
})

describe('rankMarkets - limite global', () => {
  it('respeta el limite de resultados', () => {
    const outputs: RankableMarket[] = Array.from({ length: 20 }, (_, i) =>
      makeMarket(
        i,
        makeOutput('result_1x2', { home: 0.5, draw: 0.3, away: 0.2 }),
        `T${i}A vs T${i}B`
      )
    )
    const ranked = rankMarkets(outputs, { limit: 5, maxPerFixture: 1 })
    expect(ranked.length).toBeLessThanOrEqual(5)
  })
})
