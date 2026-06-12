import type { NextRequest } from 'next/server'

export function getClientIp(request: NextRequest): string {
  // cf-connecting-ip lo setea Cloudflare y no es spoofeable por el cliente, asi
  // que tiene prioridad para que el rate limit no se pueda evadir con headers.
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // Ultimo recurso (development local sin proxy). Spoofeable: no confiar en prod.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return 'unknown'
}
