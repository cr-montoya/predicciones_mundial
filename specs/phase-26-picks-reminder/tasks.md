# phase-26-picks-reminder — Tasks

## Status

in_review

## Tasks

### Pre-implementation
- [x] 1. `spec-review` — passed (decision A: badge via shared localStorage).
- [x] 2. Design: approve banner and badge design — passed.
- [x] 3. Confirm phase-19 is implemented — confirmed (pick_${id} in localStorage).

### Implementation
- [x] 4. Create `components/picks-reminder-banner.tsx`.
- [x] 5. Create `components/fixtures-nav-badge.tsx`.
- [x] 6. Integrate banner in `app/page.tsx` passing fixtures as prop.
- [x] 7. Badge integrated in `components/nav.tsx` (not in layout.tsx — decision A).
- [x] 8. Extract `UPCOMING_UNPICKED_COUNT_KEY` as shared constant (Code Quality fix).

### Verification
- [x] 9. `pnpm tsc --noEmit` — PASS.
- [x] 10. `pnpm test` — 361/361 PASS.
- [x] 11. `pnpm build` — PASS.
- [x] 12. QA: SSR safe (count=0 initial, useEffect mounts on client) — PASS.
- [x] 13. QA: dismiss persists date-scoped in localStorage — PASS.
- [x] 14. Code Quality — PASS (no blockers).
- [x] 15. Reviewer — PASS (harness compliant).

### Closeout
- [x] 16. `spec-closeout` — in_review, PR pending.
- [x] 17. PR #19 approved and merged by owner.
- [x] 18. Mark `completed` post-merge.

## Definition of Done

- [ ] Banner appears correctly and can be closed.
- [ ] Badge in nav shows correct count.
- [ ] No content flash during SSR.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] Vercel preview reviewed.
