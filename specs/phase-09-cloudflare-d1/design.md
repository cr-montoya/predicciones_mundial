# Design: Phase 9 - Cloudflare D1

## Historical Proposed Architecture

```
Next.js
   -> Cloudflare Pages / Workers
   -> D1 SQLite serverless
   -> wrangler secrets
```

## Historical Components

- `wrangler.toml`.
- `CLOUDFLARE_DEPLOYMENT.md`.
- `data/mundial-seed.sql`.
- `DB` binding.

## Current Note

Current production lives on Vercel ISR. D1/Workers remains as a future option if a return to Cloudflare runtime is decided.

## Historical Risks

- Incompatibility with filesystem.
- Duplication between local SQLite and D1.
- Unnecessary complexity for an app that is mostly ISR-based.
