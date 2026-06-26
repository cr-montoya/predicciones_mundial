---
status: completed
phase: 22
owner: cristian
branch: phase/22-mis-picks
pr: 14
preview: https://predicciones-mundial-git-phase-22-mis-picks-romanops.vercel.app
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: passed
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-22-mis-picks — Requirements

## Status

pending

## Objective

`/my-picks` page where the user sees a summary of all their picks: pending,
correct, and wrong, with their personal accuracy counter. Closes the loop of the
picks feature (phase-19) by giving the user a place to see their complete history.

## Context

Phase-19 adds 1X2 picks saved in localStorage. Once a pick is made on each match's
page, the user has no way to see all their picks together or know their personal record.
`/my-picks` solves that.

**Depends on phase-19** (picks in localStorage must be implemented first).

## Scope

- `/my-picks` route (Client Component that reads localStorage on mount).
- Three sections: pending picks (match not started), in-progress (live), resolved
  (finished with verdict).
- Personal counter: X correct / Y resolved (Z%).
- Each pick shows: teams, my choice, actual result if available, verdict.
- Link from the home or nav.
- Empty state if no picks are saved.

## Out of Scope

- Persistence in a database or sync between devices.
- Leaderboard or comparison with other users.
- Picks for other markets (top scorers, goals). Only 1X2 result.
- Exporting or sharing the complete history (may be phase 23 for individual cards).

## Requirements

1. The `/my-picks` route is accessible and loads picks from localStorage.
2. Picks are shown grouped: pending / in-progress / resolved.
3. The personal accuracy counter is visible and correct.
4. Each resolved pick shows ✓/✗ verdict and the actual match result.
5. If no picks exist, an empty state with CTA to view fixtures is shown.
6. The page is a Client Component (needs localStorage); the general layout is
   a Server Component.

## Acceptance Criteria

- [ ] `/my-picks` renders without errors with and without picks in localStorage.
- [ ] Empty state shows CTA to `/fixtures`.
- [ ] Pending and in-progress picks are listed correctly.
- [ ] Resolved picks show verdict and actual result.
- [ ] Personal accuracy counter is correct.
- [ ] `pnpm tsc --noEmit` passes.

## Risks and Assumptions

- **Depends on phase-19**: without picks in localStorage, the page shows the
  empty state. Can be implemented after phase-19 or in parallel with empty state as MVP.
- localStorage may be empty during SSR; the component must use `useEffect` or
  `'use client'` with safe hydration to avoid mismatch.
- Fixture data (teams, scores) must be loaded from the server to enrich each pick.
  This can be resolved with a fixtures API call from the client, or by passing data
  as props from a Server Component parent.
