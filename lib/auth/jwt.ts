import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const EXPIRES_IN = '7d'

export interface AuthPayload {
  sub: number
  username: string
}

export function createToken(payload: AuthPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET)
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
