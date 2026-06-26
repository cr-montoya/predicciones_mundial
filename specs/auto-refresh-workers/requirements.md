# Requirements: Auto-refresh with Vercel

## Problem

The app is deployed as a static export on Cloudflare Pages. Data comes from
`lib/data/fixtures-cache.json`, a JSON file committed to the repo. When a match ends,
results do not appear until someone manually runs `pnpm refresh-fixtures`, commits the
JSON, and pushes.

This makes the app unusable as a live predictor during the tournament.

## Objective

Migrate from static export to **Next.js on Vercel** with native ISR.
The app must update results on its own, without manual intervention, calling the
football-data.org API from the server and using Vercel's ISR cache to avoid
exhausting the quota.

## Functional Requirements

1. The home must show fresh fixtures/results without requiring manual JSON commits.
2. The `/fixtures`, `/fixtures/[id]`, and `/groups` pages must consume the same
   fresh fixture source.
3. Vercel's ISR cache must limit calls to football-data.org to at most one per hour
   per route.
4. `tournament-prediction.json` remains precomputed because Monte Carlo is expensive.
5. The football-data.org API key must be used only on the server, never in the browser.
6. The app must be validatable in a preview deployment before merging to `main`.

## Non-Functional Requirements

1. Maintain the layer harness: UI does not directly call external APIs.
2. Compatibility with the Vercel Hobby plan (no paid features).
3. Do not reintroduce D1 or cron for this phase.
4. Do not depend on a persistent filesystem at runtime.
5. The change must preserve existing model tests.

## Success Criteria

1. `pnpm test` passes without changes to the statistical logic.
2. `pnpm build` completes without errors.
3. In the Vercel preview, `/` shows today's matches with real results.
4. After 1 hour, a new visit reflects updated results without manual intervention.
5. `lib/data/fixtures-cache.json` no longer needs to be updated manually.
