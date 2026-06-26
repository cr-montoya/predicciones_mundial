# Tasks: Vercel env vars and CSP

## 1. Developer

- [ ] Create branch from `main`: `fix/vercel-env-csp`.
- [ ] Confirm active provider in `lib/data/fallback.ts`.
- [ ] Confirm exact env var name required:
  - [ ] `FOOTBALLDATA_KEY`
  - [ ] `RAPIDAPI_KEY`
  - [ ] `API_KEY`
- [ ] Remove `output: 'export'` if the objective is runtime/ISR on Vercel.
- [ ] Adjust build scripts for Vercel if they are still oriented to static export.
- [ ] Create server-only helper to validate env vars without exposing values.
- [ ] Use the helper in API providers.
- [ ] Review `middleware.ts` and update CSP.
- [ ] Disable or document the disabling of Cloudflare Rocket Loader.
- [ ] Ensure no client component imports providers/API/server env.

## 2. Vercel Configuration

- [ ] Configure `FOOTBALLDATA_KEY` in Vercel Project Settings.
- [ ] Enable the variable for Production.
- [ ] Enable the variable for Preview.
- [ ] Enable the variable for Development if using `vercel dev`.
- [ ] Redeploy after creating/editing env vars.
- [ ] Confirm in build/runtime logs that the variable exists without printing its value.

## 3. Cloudflare Configuration

- [ ] Confirm whether the domain is still going through Cloudflare proxy.
- [ ] Disable Rocket Loader for the app.
- [ ] Disable Browser Insights if not needed.
- [ ] If Browser Insights is kept, allow `https://static.cloudflareinsights.com` in CSP.
- [ ] Avoid `unsafe-inline` in production.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Deploy preview on Vercel.
- [ ] Review `/`.
- [ ] Review `/fixtures`.
- [ ] Review `/fixtures/[id]`.
- [ ] Review `/groups`.
- [ ] Confirm real fixtures/results.
- [ ] Confirm DevTools Console without critical CSP errors.
- [ ] Confirm DevTools Network without browser calls to football-data.org.

## 5. Reviewer

- [ ] Secrets are only read in server code.
- [ ] No sensitive variable has the `NEXT_PUBLIC_` prefix.
- [ ] CSP does not use `unsafe-inline` in production unless documented as an exception.
- [ ] No imports of providers/server env in client components.
- [ ] Build no longer depends on static export if auto-refresh is required.

## 6. Security

- [ ] API key does not appear in committed files.
- [ ] API key does not appear in logs.
- [ ] API key does not appear in the client bundle.
- [ ] CSP keeps `frame-ancestors 'none'` or `X-Frame-Options: DENY`.
- [ ] Cloudflare scripts allowed only if necessary.

## 7. Owner Review

- [ ] Review Vercel preview.
- [ ] Validate that data loads correctly.
- [ ] Validate clean console or with accepted warnings.
- [ ] Approve PR before merge to `main`.

## 8. Rollback

- [ ] Revert PR if Vercel production fails.
- [ ] Restore previous CSP if a critical integration fails.
- [ ] Temporarily disable Cloudflare proxy to isolate if the problem comes from injection.
- [ ] Redeploy last stable deployment from Vercel.
