import { describe, it, expect } from 'vitest'
import { poissonPmf, poissonCdf } from '@/lib/model/skills/poisson'

describe('poissonPmf', () => {
  it('caso canonico: poissonPmf(2, 2) es ~0.2707', () => {
    expect(poissonPmf(2, 2)).toBeCloseTo(0.2707, 4)
  })

  it('poissonPmf(0, 1.35) es e^(-1.35) ~0.2592', () => {
    expect(poissonPmf(0, 1.35)).toBeCloseTo(Math.exp(-1.35), 6)
    expect(poissonPmf(0, 1.35)).toBeCloseTo(0.2592, 4)
  })

  it('poissonPmf(0, 0) es 1 (lambda=0, k=0)', () => {
    expect(poissonPmf(0, 0)).toBe(1)
  })

  it('poissonPmf(-1, 2) es 0 (k negativo)', () => {
    expect(poissonPmf(-1, 2)).toBe(0)
  })

  it('poissonPmf(0, -1) es 1 (lambda negativo, k=0)', () => {
    expect(poissonPmf(0, -1)).toBe(1)
  })

  it('poissonPmf(1, -1) es 0 (lambda negativo, k>0)', () => {
    expect(poissonPmf(1, -1)).toBe(0)
  })

  it('invariante: suma para lambda=1.35 es >= 0.999', () => {
    let sum = 0
    for (let k = 0; k <= 30; k++) {
      sum += poissonPmf(k, 1.35)
    }
    expect(sum).toBeGreaterThanOrEqual(0.999)
  })

  it('invariante: suma para lambda=3.5 es >= 0.999', () => {
    let sum = 0
    for (let k = 0; k <= 30; k++) {
      sum += poissonPmf(k, 3.5)
    }
    expect(sum).toBeGreaterThanOrEqual(0.999)
  })

  it('maneja lambdas extremos bajos (0.1): suma >= 0.999', () => {
    let sum = 0
    for (let k = 0; k <= 30; k++) {
      sum += poissonPmf(k, 0.1)
    }
    expect(sum).toBeGreaterThanOrEqual(0.999)
  })

  it('maneja lambdas extremos altos (5.0): suma >= 0.999', () => {
    let sum = 0
    for (let k = 0; k <= 30; k++) {
      sum += poissonPmf(k, 5.0)
    }
    expect(sum).toBeGreaterThanOrEqual(0.999)
  })

  it('k muy grande con lambda pequeno produce probabilidad muy baja pero no negativa', () => {
    const p = poissonPmf(25, 1.35)
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThan(0.0001)
  })
})

describe('poissonCdf', () => {
  it('poissonCdf(2, 2) es suma pmf(0)+pmf(1)+pmf(2) ~0.6767', () => {
    const manual =
      poissonPmf(0, 2) + poissonPmf(1, 2) + poissonPmf(2, 2)
    expect(poissonCdf(2, 2)).toBeCloseTo(manual, 10)
    expect(poissonCdf(2, 2)).toBeCloseTo(0.6767, 4)
  })

  it('poissonCdf(-1, 2) es 0 (k negativo)', () => {
    expect(poissonCdf(-1, 2)).toBe(0)
  })

  it('poissonCdf(k, lambda<=0) es 1', () => {
    expect(poissonCdf(5, 0)).toBe(1)
    expect(poissonCdf(5, -1)).toBe(1)
  })

  it('CDF es monotona creciente', () => {
    const lambda = 2.5
    let prev = poissonCdf(0, lambda)
    for (let k = 1; k <= 10; k++) {
      const curr = poissonCdf(k, lambda)
      expect(curr).toBeGreaterThanOrEqual(prev)
      prev = curr
    }
  })

  it('CDF nunca supera 1.0', () => {
    for (let k = 0; k <= 15; k++) {
      expect(poissonCdf(k, 2.0)).toBeLessThanOrEqual(1.0)
    }
  })
})
