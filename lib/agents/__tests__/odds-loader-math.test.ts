import { describe, it, expect } from 'vitest'
import { adjustedProbabilities, aggregateOutcomes } from '@/lib/agents/odds-loader'

// OddsAPIOutcome shape: { name: string; price: number; point?: number }
// OddsAPIOutcome is not exported; plain object literals are used here.

describe('adjustedProbabilities', () => {
  it('odds [1.80, 3.60, 4.50] => adjusted probabilities sum to 1.0 (1X2 market)', () => {
    const outcomes = [
      { name: 'Home', price: 1.80 },
      { name: 'Draw', price: 3.60 },
      { name: 'Away', price: 4.50 },
    ]
    const probs = adjustedProbabilities(outcomes)
    expect(probs).not.toBeNull()
    const sum = probs!.reduce((acc, p) => acc + p, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(1e-9)
  })

  it('odds [1.95, 1.90] => adjusted probabilities sum to 1.0 (over/under market)', () => {
    const outcomes = [
      { name: 'Over', price: 1.95 },
      { name: 'Under', price: 1.90 },
    ]
    const probs = adjustedProbabilities(outcomes)
    expect(probs).not.toBeNull()
    const sum = probs!.reduce((acc, p) => acc + p, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(1e-9)
  })

  it('raw probabilities before normalization reflect overround > 1.0', () => {
    // For [1.80, 3.60, 4.50]: raws = [0.5556, 0.2778, 0.2222] => sum ~1.0556
    // After normalization each raw / overround => sum exactly 1.
    // We verify the raw sum exceeds 1 by manually computing it.
    const prices = [1.80, 3.60, 4.50]
    const rawSum = prices.reduce((acc, p) => acc + 1 / p, 0)
    expect(rawSum).toBeGreaterThan(1.0)
  })

  it('guard: price <= 1.0 returns null', () => {
    const outcomes = [
      { name: 'Home', price: 0.9 },
      { name: 'Draw', price: 3.60 },
      { name: 'Away', price: 4.50 },
    ]
    const probs = adjustedProbabilities(outcomes)
    expect(probs).toBeNull()
  })

  it('guard: price exactly 1.0 returns null', () => {
    const outcomes = [
      { name: 'Home', price: 1.0 },
      { name: 'Away', price: 2.0 },
    ]
    const probs = adjustedProbabilities(outcomes)
    expect(probs).toBeNull()
  })

  it('guard: empty outcomes array -> overround = 0 returns null', () => {
    // No outcomes means reduce starts at 0 and stays 0 => overround === 0 => null.
    const probs = adjustedProbabilities([])
    expect(probs).toBeNull()
  })

  it('all adjusted probabilities are in range (0, 1) exclusive for valid odds', () => {
    const outcomes = [
      { name: 'Home', price: 1.80 },
      { name: 'Draw', price: 3.60 },
      { name: 'Away', price: 4.50 },
    ]
    const probs = adjustedProbabilities(outcomes)!
    for (const p of probs) {
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(1)
    }
  })
})

describe('aggregateOutcomes', () => {
  it('single bookmaker: prices pass through unchanged', () => {
    const groups = [
      [
        { name: 'Home', price: 1.80 },
        { name: 'Draw', price: 3.60 },
        { name: 'Away', price: 4.50 },
      ],
    ]
    const aggregated = aggregateOutcomes(groups)
    const home = aggregated.find(o => o.name === 'Home')
    expect(home?.price).toBeCloseTo(1.80, 10)
  })

  it('two bookmakers: prices averaged correctly', () => {
    const groups = [
      [{ name: 'Home', price: 1.80 }, { name: 'Away', price: 2.00 }],
      [{ name: 'Home', price: 1.90 }, { name: 'Away', price: 2.10 }],
    ]
    const aggregated = aggregateOutcomes(groups)
    const home = aggregated.find(o => o.name === 'Home')
    const away = aggregated.find(o => o.name === 'Away')
    expect(home?.price).toBeCloseTo(1.85, 10)
    expect(away?.price).toBeCloseTo(2.05, 10)
  })

  it('totals outcomes keyed by name+point, averaged correctly', () => {
    const groups = [
      [
        { name: 'Over', price: 1.95, point: 2.5 },
        { name: 'Under', price: 1.90, point: 2.5 },
      ],
      [
        { name: 'Over', price: 1.85, point: 2.5 },
        { name: 'Under', price: 2.00, point: 2.5 },
      ],
    ]
    const aggregated = aggregateOutcomes(groups)
    const over = aggregated.find(o => o.name === 'Over')
    const under = aggregated.find(o => o.name === 'Under')
    expect(over?.price).toBeCloseTo(1.90, 10)
    expect(under?.price).toBeCloseTo(1.95, 10)
  })

  it('empty groups return empty array', () => {
    const aggregated = aggregateOutcomes([])
    expect(aggregated).toHaveLength(0)
  })
})
