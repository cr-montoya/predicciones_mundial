# Requirements: Phase 10 - Hardening and Authentication

## Status

Completed as a base. Subsequent CSP/env var adjustments are handled in specific fixes.

## Objective

Secure the app with rate limiting, simple authentication, and security headers.

## Requirements

1. Implement rate limiting by IP.
2. Create user support and password hashing.
3. Issue JWT in an httpOnly cookie.
4. Protect sensitive operations.
5. Add security headers.
6. Avoid secret exposure.

## Success Criteria

1. Auth/rate limit tests pass.
2. Security reports no criticals.
3. Main headers are present.
