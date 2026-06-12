import jwt from 'jsonwebtoken'

const EXPIRES_IN = '7d'

// Resolve the secret lazily so the module can load in the Edge runtime even
// when the env var is injected later. In production we refuse to fall back to a
// public default, which would let anyone forge valid tokens.
function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set. Refusing to use an insecure fallback in production.')
  }
  return 'dev-secret-change-in-production'
}

export interface AuthPayload {
  sub: number
  username: string
}

export function createToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret())
    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && 'username' in decoded) {
      return decoded as unknown as AuthPayload
    }
    return null
  } catch {
    return null
  }
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const authCookie = cookies.find((c) => c.startsWith('auth='))
  return authCookie ? authCookie.slice(5) : null
}
