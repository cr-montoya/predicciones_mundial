import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { verifyPassword } from '@/lib/auth/password'
import { createToken } from '@/lib/auth/jwt'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { getClientIp } from '@/lib/middleware/get-ip'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  const rateLimitResult = checkRateLimit(ip, { maxRequests: 5, windowMs: 60 * 1000 })
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    const user = getDb()
      .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
      .get(username) as { id: number; username: string; password_hash: string } | undefined

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = createToken({ sub: user.id, username: user.username })

    const response = NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    )

    response.cookies.set('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
