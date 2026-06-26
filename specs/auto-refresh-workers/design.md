# Design: Auto-refresh with Vercel

## Current State

```
scripts/refresh-fixtures.ts
   -> manually calls football-data.org
   -> writes lib/data/fixtures-cache.json (committed)

lib/agents/live-loader.ts
   -> import fixturesCache from '@/lib/data/fixtures-cache.json'
   -> reads tournamentPrediction from precomputed JSON

app/page.tsx + app/fixtures/page.tsx + app/groups/page.tsx
   -> export const revalidate = 3600
   -> ignored in static export

next.config.ts
   -> output: 'export'

package.json build
   -> "next build && node scripts/make-out.mjs"
   -> generates out/ with static HTML

Cloudflare Pages
   -> serves out/ as static files
```

## Target State

```
lib/agents/live-loader.ts
   -> calls fetchFixtures() at runtime (football-data.org)
   -> tournament-prediction.json remains precomputed

app/page.tsx + app/fixtures/page.tsx + app/groups/page.tsx
   -> export const revalidate = 3600
   -> works natively with Vercel ISR

next.config.ts
   -> without output: 'export'

package.json build
   -> next build (Vercel detects automatically)

Vercel
   -> serves the app as Next.js with native ISR
   -> Vercel caches each page on the edge based on revalidate
   -> on expiry, the next request regenerates the page from the server
   -> the server calls the API and serves fresh data
```

## Technical Changes

### `next.config.ts`

Remove `output: 'export'`.

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

### `package.json`

Update build script:

```json
"build": "next build"
```

Remove `scripts/make-out.mjs` and its invocation. Vercel does not need a
post-build script.

### `lib/agents/live-loader.ts`

Central change: replace the static JSON import with a runtime API call.

Before:

```ts
import fixturesCache from '@/lib/data/fixtures-cache.json'

export function loadFixtures(): Fixture[] {
  return (fixturesCache as { fixtures: unknown[] }).fixtures as Fixture[]
}
```

After:

```ts
import { fetchFixtures } from '@/lib/data/api-football'

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

export async function loadFixtures(): Promise<Fixture[]> {
  return fetchFixtures(WC_LEAGUE_ID, WC_SEASON)
}
```

`loadFixtures` changes from synchronous to `async`. All callers must add `await`.

### `middleware.ts` → `proxy.ts`

Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. Vercel
fully supports the new convention. Rename the file and export `proxy`
instead of `middleware`.

```ts
export function proxy(request: NextRequest) { ... }
```

The `config.matcher` configuration does not change.

### `tournament-prediction.json`

No change: the Monte Carlo remains precomputed with `pnpm precompute`
and committed when a fresh projection is desired.

### Environment Variables

The football-data.org API key must be set as an environment variable in Vercel:

```
FOOTBALLDATA_KEY=<value>
```

Configure in: Vercel dashboard → project → Settings → Environment Variables.

Verify that `lib/data/providers/football-data.ts` reads the key from
`process.env.FOOTBALLDATA_KEY`.

### Files Removable After Validation

- `scripts/make-out.mjs`
- `lib/data/fixtures-cache.json`
- `wrangler.toml` (or keep for local reference with Wrangler)
- `out/`, if accidentally tracked

## Data Flow

```
User visits /

Vercel Edge cache HIT (< 1 hour since last generation)
   -> serves cached HTML immediately

Vercel Edge cache MISS (> 1 hour or first request)
   -> activates Next.js server
   -> executes app/page.tsx (Server Component)
   -> live-loader.ts calls fetchFixtures() -> football-data.org
   -> models run in memory
   -> server returns HTML + revalidation headers
   -> Vercel caches the response based on revalidate = 3600
   -> user receives fresh HTML
```

Result: results updated automatically, maximum 1 hour delay.
No manual commits. No manual deploys.

## Risks and Compatibility

### `better-sqlite3`

Status: devDependency. `lib/db/client.ts` imports it with lazy `require()`.

Risk: if any page imports `lib/db/client.ts` at runtime, it will fail
in production because Vercel serverless does not have a persistent filesystem.

Action: verify with grep that no App Router page imports `lib/db/`.

### `jsonwebtoken`

Status: production dependency. Used in `lib/auth/jwt.ts`.

Low risk: `jsonwebtoken` uses Node.js `crypto`. In Vercel's serverless
runtime (Node.js), this works without issue. It would only be a problem if
moved to Edge runtime, which does not apply here.

### `framer-motion`

Status: production dependency. Used in `components/fade-in.tsx` and
`components/bounce-number.tsx` as client components.

Low risk: framer-motion runs in the browser. Verify that the components
have `'use client'`. If the build fails, use
`dynamic(() => import(...), { ssr: false })`.

### `fetchFixtures` and Rate Limiting During Build

During `next build`, Vercel pre-renders ISR pages. For
`/fixtures/[id]`, `generateStaticParams` generates all routes in
parallel, which may exhaust the football-data rate limit (10 req/min).

Expected behavior: pages not pre-rendered in build due to rate limits
are generated on-demand on the first request. The 1h ISR applies equally to all.

Action: no change required; the fallback to mock data during build is
acceptable. At runtime, the API is called only once per 1-hour window per route.
