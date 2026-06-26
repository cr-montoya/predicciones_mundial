# Tasks: Auto-refresh with Vercel

## 1. Developer

- [ ] Add `@cloudflare/next-on-pages` to devDependencies (NO — not needed for Vercel).
- [x] Update `next.config.ts` and remove `output: 'export'`.
- [x] Update `build` script in `package.json` to `next build`.
- [x] Migrate `lib/agents/live-loader.ts`: `loadFixtures` becomes async with runtime fetch.
- [x] Add `await` on pages that call `loadFixtures()` directly.
- [ ] Rename `middleware.ts` to `proxy.ts` and export `proxy` function (Next.js 16).
- [ ] Confirm `FOOTBALLDATA_KEY` in `.env.local` for local testing.
- [x] Keep `tournament-prediction.json` as precomputed data.
- [ ] Remove `scripts/make-out.mjs` (no longer used).

## 2. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test` (model logic does not change).
- [ ] `pnpm build`.
- [ ] `pnpm dev` + local smoke test of `/`, `/groups`, `/fixtures`, `/fixtures/[id]`.
- [ ] Verify no imports of `lib/db` in App Router pages.
- [ ] Verify `FOOTBALLDATA_KEY` is not hardcoded in any file.

## 3. Reviewer

- [ ] No imports of `lib/db` in App Router pages.
- [ ] `loadFixtures` is async on all pages that call it.
- [ ] Secrets not exposed in code.
- [ ] `scripts/make-out.mjs` is removed or clearly outside the build.
- [ ] `fixtures-cache.json` not used at runtime.

## 4. Security

- [ ] `FOOTBALLDATA_KEY` does not appear in any committed file.
- [ ] API key only travels server → API, never to the browser.
- [ ] No new production dependencies.
- [ ] No logs of secrets or sensitive responses.

## 5. Deploy

- [ ] Connect repo to Vercel (vercel.com → Add New Project → import repo).
- [ ] Configure `FOOTBALLDATA_KEY` as an environment variable in the Vercel dashboard.
- [ ] Framework preset: Next.js (Vercel detects automatically).
- [ ] Build command: `pnpm build` (or use Vercel default).
- [ ] Verify preview deployment with fresh results.
- [ ] Review Vercel logs for no runtime errors.
- [ ] Owner approves PR and preview.
- [ ] Merge to `main`.
- [ ] Verify production with auto-refresh.

## 6. Rollback

- [ ] Revert PR if production fails.
- [ ] Restore `output: 'export'` and `scripts/make-out.mjs` if a return to static is needed.
- [ ] Keep `fixtures-cache.json` until preview and production are validated.
