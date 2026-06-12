import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromCookie } from '@/lib/auth/jwt'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { getClientIp } from '@/lib/middleware/get-ip'

const PROTECTED_ROUTES = ['/api/actions/refresh', '/api/auth/logout']
const PUBLIC_ROUTES = ['/api/auth/login', '/']

export function middleware(request: NextRequest) {
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

  // Proteger rutas sensibles
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const cookieHeader = request.headers.get('cookie')
    const token = getTokenFromCookie(cookieHeader)

    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'nonce-random'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
