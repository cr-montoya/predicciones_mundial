import type { NextRequest } from 'next/server'

export function getClientIp(request: NextRequest): string {
  // cf-connecting-ip is set by Cloudflare and cannot be spoofed by the client,
  // so it takes priority to prevent rate-limit evasion via forged headers.
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // Last resort (local dev without a proxy). Spoofable — do not trust in production.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return 'unknown'
}
