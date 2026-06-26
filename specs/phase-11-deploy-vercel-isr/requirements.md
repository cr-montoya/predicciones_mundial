# Requirements: Phase 11 - Deploy and Vercel ISR

## Status

Completed. Current production on Vercel ISR.

## Objective

Deploy the app with Next.js runtime and ISR to get fresh fixtures without manual commits.

## Requirements

1. `next.config.ts` must not use `output: 'export'`.
2. Build must use `next build`.
3. Vercel must handle PR previews.
4. Server-side variables must be configured in Vercel.
5. Main pages must use `revalidate = 3600`.
6. API keys must not be exposed to the client.

## Success Criteria

1. Vercel preview loads `/`, `/fixtures`, `/fixtures/[id]`, and `/groups`.
2. Production deploys from `main`.
3. Runtime logs allow diagnosing env/API issues.
