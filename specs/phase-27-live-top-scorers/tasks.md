# Live Top Scorers — Tasks

## Status

in_review

## Tasks

### Pre-implementation

- [x] 1. **Spec Review** — PASSED. Runtime-import blocker resolved before implementing.
- [x] 2. **Data Contract** — PASSED. Shape confirmed: `{ scorers: [{ player: { id, name }, team: { id }, goals, assists }] }`. playerId and assists default to 0 if absent.
- [x] 3. **Grill** — CLEAR TO IMPLEMENT. No blockers.
- [x] 4. **Analyst** — PASSED. Two-tier sort approved; match by name+teamId with fallback to name-only when teamId null; `—` for null probability; "Probabilities calculated" as label.
- [x] 5. **Design** — VISUALLY APPROVED. Green column `#02B906` for goals, `w-64 text-right tabular-nums`, `1 goal`/`5 goals` singular/plural, date label below title.

### Implementation

- [x] 6. **Extract `FD_TEAM_MAP` to `lib/data/fd-team-map.ts`**: extracts `FD_TEAM_MAP`, `toCanonicalTeamId`, and `FD_BASE_URL`. Both providers and scripts import from here.
- [x] 7. **Skill — `lib/skills/normalize-scorer-name.ts`**: created with `normalizeName` (regex `̀-ͯ`), `LiveScorer`, `CandidateRow`, `mergeScorersWithCandidates`. Strict match by teamId+name; fallback to name-only when teamId null. Script imports `normalizeName` and `toCanonicalTeamId` from new modules.
- [x] 8. **Agent — `fetchLiveScorers()` + `buildInitialCandidates()`**: in `lib/agents/live-loader.ts`. Uses `apiFetch` with ISR 3600s, filters `s.team?.id` to avoid teamId 0. Fallback to `[]` on error or missing key.
- [x] 9. **`HomeData`**: extended with `candidates: CandidateRow[]` and `goldenBootComputedAt: string` in `home-types.ts`. `loadHomeData` runs fixtures and scorers in parallel with `Promise.all`.
- [x] 10. **`app/page.tsx`**: passes `candidates` and `goldenBootComputedAt` to `<Candidates>`.
- [x] 11. **`components/candidates.tsx`**: new `BootList` with props `candidates/computedAt`; goals column in green `#02B906`; `1 goal`/`5 goals`; label "Probabilities calculated: DD/MM/YYYY"; separate `WinnerList` keeps bars. `getFlag` removed from boot.

### Post-implementation

- [x] 12. **QA** — 23 new tests in `lib/skills/__tests__/normalize-scorer-name.test.ts`. All pass. Covers normalizeName, merge logic, sort order, fallback, collisions.
- [x] 13. **`pnpm tsc --noEmit`** — PASSED.
- [x] 14. **`pnpm test`** — PASSED. 384/384 tests (24 test files).
- [x] 15. **`pnpm build`** — PASSED. Scorers endpoint called in build with status 200.
- [x] 16. **`pnpm spec:check`** — Phase-27 without errors. Pre-existing errors in phases 18-26 (open tasks in completed specs, pre-existed).
- [x] 17. **Code Quality** — PASSED after fixes: `s.team?.id` filter, `̀-ͯ` regex, `FD_BASE_URL` exported from fd-team-map, script uses `toCanonicalTeamId`.
- [x] 18. **Reviewer** — APPROVED. No harness violations.
- [x] 19. **Security** — APPROVED pre-implementation. Re-verify against PR diff.
- [ ] 20. **Grill re-check** — pending.
- [ ] 21. **Vercel Preview** — pending (requires deploy).

## Definition of Done

- [x] Requirements are satisfied.
- [x] Design constraints followed.
- [x] Applicable gates executed or documented as not_applicable.
- [ ] `pnpm spec:check` passes without phase-27 errors (pre-existing from other phases documented).
- [x] Tests run (384/384).
- [x] `specs/README.md` is updated.
- [ ] PR template references this spec.
