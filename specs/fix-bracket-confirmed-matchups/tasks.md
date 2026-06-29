# Fix Bracket Confirmed Matchups — Tasks

## Status

in_review

## Tasks

### Step 0 — Diagnosis (before implementing)

- [x] 0.1 Run `pnpm refresh-fixtures` → 88 valid fixtures (of 104 total),
      `generatedAt: 2026-06-29T05:21:32Z`.
- [x] 0.2 16 LAST_32 fixtures confirmed with real teams. Code fix was needed — bug was
      both code logic + stale cache.
- [x] 0.3 Verified: Colombia (20) vs Ghana (135) in the API. Bug was that code ignored
      API data and projected from standings using the June 14 stale cache.

### Step 1 — Update fixtures-cache.json

- [x] 1.1 `pnpm refresh-fixtures` succeeded. 88 fixtures written to
      `lib/data/fixtures-cache.json`.
- [x] 1.2 count=88 > 72, generatedAt=2026-06-29T05:21:32Z.

### Step 2 — Fix in app/bracket/page.tsx

- [x] 2.1 Built `r32ByTeam: Map<number, Fixture>` indexed by teamId using
      `normalizeKnockoutStage`.
- [x] 2.2 For each def: project with `resolveSlot`, look up confirmed fixture via
      projected team, use API fixture if found.
- [x] 2.3 `confirmedScore` passed to `ResolvedMatchup` when
      `status === 'finished' | 'live'`.
- [x] 2.4 `isProjected: false` when team comes from the API fixture.
- [x] 2.5 Removed `confirmedKnockout` and `confirmedTeams` (dead code). Replaced by
      `r32ByTeam`.
- [x] Bonus: `positionLabel` assigned by teamId (not by position in the def) to avoid
      swap when the API inverts home/away vs the def.

### Step 3 — Verification

- [x] 3.1 `pnpm tsc --noEmit` → OK.
- [x] 3.2 `pnpm test` → 384/384 passed.
- [x] 3.3 `pnpm build` → OK, `/bracket` static ISR.
- [x] 3.4 `pnpm spec:check` → pre-existing errors in old specs, none from this fix.
- [ ] 3.5 Verify `/bracket` on Vercel preview (Colombia vs Ghana visible for M83).
- [ ] 3.6 Verify the other 15 Round of 32 fixtures on the preview.

### Step 4 — Closeout

- [ ] 4.1 Run QA, Code Quality, Reviewer gates.
- [ ] 4.2 Run `spec-closeout`.
- [ ] 4.3 Prepare PR with `pr-prep`.
- [ ] 4.4 Review Vercel preview.

## Definition of Done

- [ ] All spec requirements are satisfied.
- [ ] Bracket shows Colombia vs Ghana (not Ecuador) and all other confirmed R32
      matchups are correct.
- [ ] No dead code (`confirmedTeams` unused variable removed).
- [ ] Fallback to standings still works when the API does not have a confirmed team.
- [ ] QA, Code Quality, Reviewer gates run or documented as not applicable.
- [ ] `pnpm spec:check` passes.
- [ ] `specs/README.md` updated.
- [ ] PR template references this spec.
