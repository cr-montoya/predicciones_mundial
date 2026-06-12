import type { NextRequest } from 'next/server'

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const ip = request.headers.get('x-real-ip')
  if (ip) return ip

  // Fallback: en development/Cloudflare usar request headers
  return request.headers.get('cf-connecting-ip') || 'unknown'
}
