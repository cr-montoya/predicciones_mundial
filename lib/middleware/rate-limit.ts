const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
}

export function checkRateLimit(
  ip: string,
  options: Partial<RateLimitOptions> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { maxRequests, windowMs } = { ...DEFAULT_OPTIONS, ...options }
  const now = Date.now()

  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  // Existing window
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// Cleanup: remover entries expirados cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)
