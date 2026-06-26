# Requirements: Vercel env vars and CSP

## Problem

The app was migrated to Vercel and is not loading the API variable even though it is defined.
Inspecting the browser shows CSP errors related to Cloudflare scripts:

- `static.cloudflareinsights.com/beacon.min.js` blocked by `script-src 'self'`.
- `rocket-loader.min.js` executing inline scripts blocked by `script-src 'self'`.
- A secondary connection closed error in a client chunk.

These errors may coexist with the env vars problem but do not necessarily have the same
cause. The diagnosis of frontend/CSP and runtime/env server-side must be separated.

## Objective

Make the app on Vercel:

1. Correctly read the API key from server-side environment variables.
2. Not expose secrets to the browser.
3. Not break legitimate scripts due to CSP.
4. Not depend on Cloudflare-injected scripts to function.
5. Have a clear verification in preview before touching production.

## Functional Requirements

1. The app must load fixtures from the configured provider using `FOOTBALLDATA_KEY`
   or the API variable corresponding to the active provider.
2. If the environment variable is missing in Vercel, the app must fail with a clear
   server-side error in logs, not with an ambiguous client error.
3. The main pages must render in Vercel preview:
   - `/`
   - `/fixtures`
   - `/fixtures/[id]`
   - `/groups`
4. The CSP must allow scripts necessary for Next/Vercel and block unwanted injections.
5. If Cloudflare is still in front of Vercel as proxy/CDN, Browser Insights/Rocket Loader
   must be disabled or explicitly allowed in a controlled way.

## Non-Functional Requirements

1. No API key must use the `NEXT_PUBLIC_` prefix.
2. No API key must be printed to the console or sent to the client.
3. The solution must work in Vercel Production, Preview, and Development.
4. The configuration must be documented so each PR can be reviewed from the preview deployment.
5. The fix must not weaken CSP with `unsafe-inline` in production unless there is a temporary
   justification with a follow-up task.

## Success Criteria

1. Vercel logs show that the required variable exists without revealing its value.
2. `/` renders real fixtures in preview and production.
3. No CSP errors appear that block scripts necessary for the app.
4. If Cloudflare is proxying the domain, Rocket Loader does not inject scripts that break the app.
5. `pnpm build` and `pnpm test` pass before the PR.
