# Design: Phase 10 - Hardening and Authentication

## Components

- `lib/auth/password.ts`.
- `lib/auth/jwt.ts`.
- `lib/middleware/rate-limit.ts`.
- `lib/middleware/get-ip.ts`.
- Middleware/headers as per platform.

## Security

- Hashed passwords.
- JWT with expiration.
- httpOnly/Secure/SameSite cookies where applicable.
- CSP, HSTS, nosniff, frame protection.

## Current Note

When migrating to Vercel, CSP and middleware must be reviewed for compatibility with Next/Vercel.

## Risks

- CSP too strict for Next.
- In-memory rate limit is not persistent.
- JWT secret missing in production.
