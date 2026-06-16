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

  // Next.js App Router requiere 'unsafe-inline' en script-src: inyecta scripts inline para
  // el RSC payload (self.__next_f.push). Sin esto la hidratación falla en producción.
  // 'unsafe-eval' solo en dev (turbopack lo necesita).
  // Vercel preview inyecta feedback.js desde vercel.live — solo lo permitimos en preview.
  const isDev = process.env.NODE_ENV === 'development'
  const isVercelPreview = process.env.VERCEL_ENV === 'preview'
  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : isVercelPreview
      ? "'self' 'unsafe-inline' https://vercel.live"
      : "'self' 'unsafe-inline'"
  const csp = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`

  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
