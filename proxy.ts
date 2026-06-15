import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { getClientIp } from '@/lib/middleware/get-ip'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  // Rate limiting global (excepto static assets)
  if (!pathname.startsWith('/_next') && !pathname.startsWith('/public')) {
    const rateLimitResult = checkRateLimit(ip, { maxRequests: 100, windowMs: 60 * 1000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  // Agregar security headers
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // CSP: más permisivo en desarrollo (React necesita unsafe-eval), restrictivo en producción
  const isDev = process.env.NODE_ENV === 'development'
  const csp = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"

  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
