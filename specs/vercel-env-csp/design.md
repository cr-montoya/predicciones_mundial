# Design: Vercel env vars and CSP

## Expected Diagnosis

There are two distinct problems that may appear at the same time:

1. **Env var not available in Vercel runtime/build**.
2. **CSP blocking scripts injected by Cloudflare**.

Browser CSP errors do not by themselves prove that the API key is missing. The API key
is read server-side via `process.env.FOOTBALLDATA_KEY`, so the real diagnosis must come
from Vercel logs or an endpoint/server component that validates presence without exposing
the value.

## Relevant Current State

### CSP

`middleware.ts` defines in production:

```txt
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
```

This blocks:

- `https://static.cloudflareinsights.com/beacon.min.js`
- Inline scripts that Rocket Loader tries to execute.

### Env vars

`lib/data/providers/football-data.ts` reads:

```ts
const key = process.env.FOOTBALLDATA_KEY
```

If the variable does not exist, it throws:

```txt
Missing required environment variable: FOOTBALLDATA_KEY
```

### Runtime

If the app still has `output: 'export'`, there is no server runtime in Vercel to refresh
data per request. In static export, data and env vars used by server code are resolved
during build. For auto-refresh in Vercel, the app must run as Next server runtime or ISR,
not as a pure static export.

## Solution Design

### 1. Confirm the provider and exact variable name

Validate which provider is active:

- `FootballDataProvider` requires `FOOTBALLDATA_KEY`.
- `ApiFootballProvider` requires `API_KEY` or `RAPIDAPI_KEY`.

The variable configured in Vercel must match exactly the provider used by
`lib/data/fallback.ts`.

### 2. Configure Vercel env vars by environment

In Vercel Project Settings -> Environment Variables:

- `FOOTBALLDATA_KEY`: Production, Preview, and Development if all three will be used.
- `RAPIDAPI_KEY` or `API_KEY`: only if the fallback/provider needs it.

After creating or editing env vars, a redeploy is mandatory. Vercel does not inject env
changes into already built deployments.

### 3. Add server-side verification without exposing secrets

Create a server-only utility:

```ts
export function requireServerEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`)
  }
  return value
}
```

Use it in providers to standardize errors. Do not return values to the client.

Optional for temporary diagnosis:

- Log only the presence and length of the variable in server logs.
- Remove the log after validation.
- Never log the value.

### 4. Decide runtime in Vercel

If auto-refresh with ISR/runtime is desired:

- Remove `output: 'export'` from `next.config.ts`.
- Remove custom static export scripts if still active.
- Use `export const revalidate = 3600` on server pages.
- Ensure that `loadFixtures()` runs on the server, not in client components.

If keeping static export:

- The API key is only used in build.
- Each data change requires a redeploy.
- There is no real auto-refresh.

For the current objective, the correct option is runtime/ISR on Vercel.

### 5. Fix CSP without opening too wide

Recommended option if Cloudflare only points to the Vercel domain:

- Disable Rocket Loader for this site/route.
- Disable Cloudflare Browser Insights if not needed.
- Keep strict CSP.

Alternative option if Cloudflare scripts are to be kept:

```txt
script-src 'self' https://static.cloudflareinsights.com;
connect-src 'self' https://vitals.vercel-insights.com https://api.football-data.org;
```

Do not recommend `unsafe-inline` in production. Rocket Loader depends on inline scripts,
so allowing it weakens CSP. It is better to disable Rocket Loader.

### 6. Vercel-compatible CSP

Add at minimum:

```txt
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://vitals.vercel-insights.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

If the app makes direct browser fetch to any external domain, that domain must be in
`connect-src`. The football-data API should not be in the browser; if it appears in the
client Network tab, there is an architecture leak.

### 7. Validation in Vercel

Use the PR preview deployment:

1. Review Vercel build logs.
2. Review runtime logs when loading `/`.
3. Confirm that `FOOTBALLDATA_KEY` exists without showing its value.
4. Open DevTools -> Network and confirm that the external API is not called from the browser.
5. Open DevTools -> Console and confirm no CSP blocking necessary scripts.

## Risks

### Cloudflare in front of Vercel

If Cloudflare continues proxying the domain, it can inject scripts even though the app is on
Vercel. Rocket Loader can break Next.js and CSP.

Mitigation: create a Page Rule/Configuration Rule to disable Rocket Loader on the domain
or change the record to DNS only if the proxy is not needed.

### Env vars only in Production

If the variable is marked only for Production, previews fail.

Mitigation: enable the variable for Preview as well.

### Static export

If `output: 'export'` is still active, there is no server runtime for auto-refresh.

Mitigation: migrate to Next runtime/ISR on Vercel.

### Accidentally exposed secrets

Using `NEXT_PUBLIC_FOOTBALLDATA_KEY` would expose the key to the browser.

Mitigation: keep secrets without `NEXT_PUBLIC_` and consume them only from server code.
