import { describe, it, expect } from 'vitest'
import {
  deriveActualOutcome,
  topModelCall,
  resolveModelVerdict,
  computeAccuracyStats,
  type MatchAccuracyRecord,
} from '@/lib/skills/accuracy'

describe('deriveActualOutcome', () => {
  it('home win', () => expect(deriveActualOutcome(2, 0)).toBe('home'))
  it('away win', () => expect(deriveActualOutcome(0, 3)).toBe('away'))
  it('draw', () => expect(deriveActualOutcome(1, 1)).toBe('draw'))
  it('0-0 draw', () => expect(deriveActualOutcome(0, 0)).toBe('draw'))
})

describe('topModelCall', () => {
  it('returns home when home prob is highest', () => {
    expect(topModelCall({ home: 0.6, draw: 0.25, away: 0.15 })).toBe('home')
  })
  it('returns away when away prob is highest', () => {
    expect(topModelCall({ home: 0.2, draw: 0.3, away: 0.5 })).toBe('away')
  })
  it('returns draw when draw prob is highest', () => {
    expect(topModelCall({ home: 0.3, draw: 0.4, away: 0.3 })).toBe('draw')
  })
  it('returns null for empty probabilities', () => {
    expect(topModelCall({})).toBeNull()
  })
  it('returns null for unknown keys', () => {
    expect(topModelCall({ unknown: 1.0 })).toBeNull()
  })
})

describe('resolveModelVerdict', () => {
  const probs = { home: 0.6, draw: 0.25, away: 0.15 }

  it('correct when top-1 matches actual outcome', () => {
    expect(resolveModelVerdict(probs, 2, 0)).toBe('correct')
  })
  it('incorrect when top-1 does not match actual outcome', () => {
    expect(resolveModelVerdict(probs, 0, 1)).toBe('incorrect')
    expect(resolveModelVerdict(probs, 1, 1)).toBe('incorrect')
  })
  it('null for empty probabilities', () => {
    expect(resolveModelVerdict({}, 2, 0)).toBeNull()
  })
})

describe('computeAccuracyStats', () => {
  const makeRecord = (correct: boolean): MatchAccuracyRecord => ({
    fixtureId: 1,
    homeTeam: 'A',
    awayTeam: 'B',
    modelCall: 'home',
    actual: correct ? 'home' : 'away',
    correct,
    homeProb: 0.6,
    drawProb: 0.25,
    awayProb: 0.15,
  })

  it('empty input', () => {
    const stats = computeAccuracyStats([])
    expect(stats.total).toBe(0)
    expect(stats.correct).toBe(0)
    expect(stats.pct).toBe(0)
  })

  it('all correct', () => {
    const stats = computeAccuracyStats([makeRecord(true), makeRecord(true)])
    expect(stats.total).toBe(2)
    expect(stats.correct).toBe(2)
    expect(stats.pct).toBe(100)
  })

  it('mixed correct and incorrect', () => {
    const records = [makeRecord(true), makeRecord(true), makeRecord(false)]
    const stats = computeAccuracyStats(records)
    expect(stats.total).toBe(3)
    expect(stats.correct).toBe(2)
    expect(stats.pct).toBeCloseTo(66.7, 0)
  })
})
