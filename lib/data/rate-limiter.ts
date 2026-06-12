export type WindowType = 'daily' | 'sliding'

export interface RateLimiterConfig {
  /** Maximum requests allowed in the window. */
  maxRequests: number
  /** 'daily' resets at midnight; 'sliding' uses a rolling time window. */
  windowType: WindowType
  /** Only used when windowType is 'sliding': window size in milliseconds. */
  windowMs?: number
}

export class RateLimiter {
  private readonly maxRequests: number
  private readonly windowType: WindowType
  private readonly windowMs: number

  private count: number = 0
  private resetKey: string = ''
  private timestamps: number[] = []

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests
    this.windowType = config.windowType
    this.windowMs = config.windowMs ?? 60_000

    if (this.windowType === 'daily') {
      this.resetKey = new Date().toDateString()
    }
  }

  /**
   * Call before each request. Throws if the quota is exhausted.
   */
  check(): void {
    if (this.windowType === 'daily') {
      this.checkDaily()
    } else {
      this.checkSliding()
    }
  }

  /**
   * Call after each successful response to record the usage.
   */
  record(): void {
    if (this.windowType === 'daily') {
      this.count++
    } else {
      this.timestamps.push(Date.now())
    }
  }

  private checkDaily(): void {
    const today = new Date().toDateString()
    if (today !== this.resetKey) {
      this.count = 0
      this.resetKey = today
    }
    if (this.count >= this.maxRequests) {
      throw new Error(
        `Daily rate limit reached (${this.maxRequests} requests). Try again tomorrow.`
      )
    }
  }

  private checkSliding(): void {
    const now = Date.now()
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs)
    if (this.timestamps.length >= this.maxRequests) {
      throw new Error(
        `Rate limit reached: ${this.maxRequests} requests per ${this.windowMs}ms window.`
      )
    }
  }
}
