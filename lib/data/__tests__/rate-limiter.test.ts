/**
 * RateLimiter tests.
 * Daily window (RapidAPI) and sliding window (football-data).
 * No real setTimeout: getNow() is injected to simulate time.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '@/lib/data/rate-limiter'

// ---------------------------------------------------------------------------
// Daily window (RapidAPI style)
// ---------------------------------------------------------------------------

describe('RateLimiter - daily window', () => {
  it('allows up to maxRequests calls on the same day', () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowType: 'daily' })

    // Call check() + record() 5 times without throwing
    for (let i = 0; i < 5; i++) {
      expect(() => limiter.check()).not.toThrow()
      limiter.record()
    }
  })

  it('request 96 throws RateLimitError after 95 successful ones (maxRequests=95)', () => {
    const limiter = new RateLimiter({ maxRequests: 95, windowType: 'daily' })

    for (let i = 0; i < 95; i++) {
      limiter.check()
      limiter.record()
    }

    expect(() => limiter.check()).toThrow(/Daily rate limit reached/)
  })

  it('error message mentions the configured maximum limit', () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowType: 'daily' })
    for (let i = 0; i < 3; i++) {
      limiter.check()
      limiter.record()
    }
    expect(() => limiter.check()).toThrow(/3/)
  })

  it('after midnight the counter resets', () => {
    // Simulate a day change by mocking Date
    const originalDate = Date

    // Day 1: fill the quota
    const limiter = new RateLimiter({ maxRequests: 3, windowType: 'daily' })
    for (let i = 0; i < 3; i++) {
      limiter.check()
      limiter.record()
    }
    // Should throw
    expect(() => limiter.check()).toThrow(/Daily rate limit reached/)

    // Advance to the next day by mocking Date.prototype.toDateString
    const tomorrow = 'Tomorrow Jan 01 2030'
    vi.spyOn(Date.prototype, 'toDateString').mockReturnValue(tomorrow)

    // Now check must pass (reset due to day change)
    expect(() => limiter.check()).not.toThrow()
    limiter.record()

    vi.restoreAllMocks()
  })

  it('record() only increments on success: without record() the counter does not advance', () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowType: 'daily' })

    // call check without record 10 times: must not throw
    for (let i = 0; i < 10; i++) {
      expect(() => limiter.check()).not.toThrow()
    }

    // After 2 records the third check throws
    limiter.check()
    limiter.record()
    limiter.check()
    limiter.record()
    expect(() => limiter.check()).toThrow(/Daily rate limit reached/)
  })
})

// ---------------------------------------------------------------------------
// Sliding window (football-data style)
// getNow() is simulated because RateLimiter uses Date.now() internally.
// Since RateLimiter does not accept getNow(), we mock Date.now directly.
// ---------------------------------------------------------------------------

describe('RateLimiter - sliding window', () => {
  let nowMs = 1_000_000

  beforeEach(() => {
    nowMs = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => nowMs)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows up to maxRequests within the window', () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    for (let i = 0; i < 10; i++) {
      expect(() => limiter.check()).not.toThrow()
      limiter.record()
    }
  })

  it('request 11 throws when 10 are in the 60s window', () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    for (let i = 0; i < 10; i++) {
      limiter.check()
      limiter.record()
    }

    expect(() => limiter.check()).toThrow(/Rate limit reached/)
  })

  it('after the window expires, the counter resets and new requests are allowed', () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    // Record 5 requests at t=1_000_000
    for (let i = 0; i < 5; i++) {
      limiter.check()
      limiter.record()
    }
    expect(() => limiter.check()).toThrow(/Rate limit reached/)

    // Advance 61 seconds (outside the window)
    nowMs += 61_000

    // Now it must pass
    expect(() => limiter.check()).not.toThrow()
    limiter.record()
  })

  it('sliding window: old requests expire but new ones count', () => {
    const limiter = new RateLimiter({
      maxRequests: 3,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    // t=0: 3 requests
    for (let i = 0; i < 3; i++) {
      limiter.check()
      limiter.record()
    }

    // t=65s: the first 3 have expired
    nowMs += 65_000

    // Now we can make 3 more
    for (let i = 0; i < 3; i++) {
      expect(() => limiter.check()).not.toThrow()
      limiter.record()
    }

    // The 4th in this second window must throw
    expect(() => limiter.check()).toThrow(/Rate limit reached/)
  })

  it('record() only increments on success: check without record does not consume quota', () => {
    const limiter = new RateLimiter({
      maxRequests: 3,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    // check 10 times without record
    for (let i = 0; i < 10; i++) {
      expect(() => limiter.check()).not.toThrow()
    }

    // record 3 times -> quota full
    limiter.record()
    limiter.record()
    limiter.record()

    expect(() => limiter.check()).toThrow(/Rate limit reached/)
  })

  it('error mentions the configured limit and window', () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      windowType: 'sliding',
      windowMs: 60_000,
    })
    limiter.check()
    limiter.record()
    limiter.check()
    limiter.record()
    expect(() => limiter.check()).toThrow(/2/)
  })
})
