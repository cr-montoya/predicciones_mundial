# Design: Fase 10 - Hardening y autenticacion

## Componentes

- `lib/auth/password.ts`.
- `lib/auth/jwt.ts`.
- `lib/middleware/rate-limit.ts`.
- `lib/middleware/get-ip.ts`.
- Middleware/headers segun plataforma.

## Seguridad

- Passwords hasheados.
- JWT con expiracion.
- Cookies httpOnly/Secure/SameSite cuando aplique.
- CSP, HSTS, nosniff, frame protection.

## Nota vigente

Al migrar a Vercel, CSP y middleware deben revisarse por compatibilidad con Next/Vercel.

## Riesgos

- CSP demasiado estricta para Next.
- Rate limit en memoria no persistente.
- JWT secret faltante en produccion.
