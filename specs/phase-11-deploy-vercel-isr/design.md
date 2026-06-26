# Design: Phase 11 - Deploy and Vercel ISR

## Current Architecture

```
Vercel request
   -> Next.js server runtime
   -> ISR revalidate 3600
   -> live-loader fetchFixtures()
   -> render UI
```

## Configuration

- `next.config.ts` without static export.
- `package.json` with `build: next build`.
- Env vars in Vercel Production/Preview.
- PR previews as a gate before merge.

## Relationship with Infrastructure Specs

- `specs/auto-refresh-workers/` documents Workers exploration.
- `specs/vercel-env-csp/` documents env/CSP fixes for Vercel.

## Risks

- Env vars configured only for production and not preview.
- CSP incompatible with Next/Vercel.
- Cloudflare proxy injecting scripts.
