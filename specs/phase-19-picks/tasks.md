# phase-19-picks — Tasks

## Status

in_review

## Tasks

### Pre-implementation
- [x] 1. `spec-review`: validate spec is ready before implementing.
- [x] 2. `data-contract`: formalize `StoredPick` contract and `resolveVerdict` skill.
- [x] 3. Design approves `PickPanel` wireframes in its three states.
- [x] 4. Grill: detect blockers before starting.

### Implementation
- [x] 5. Create `lib/skills/picks.ts` with `deriveOutcome` and `resolveVerdict`.
- [x] 6. Write unit tests for `resolveVerdict` and `deriveOutcome` in Vitest.
- [x] 7. Create `components/pick-panel.tsx` (Client Component): 1X2 buttons, localStorage, verdict.
- [x] 8. Create `components/pick-badge.tsx` (Client Component): badge on fixture list cards.
- [x] 9. Integrate `<PickPanel>` in `app/fixtures/[id]/page.tsx`.
- [x] 10. Integrate `<PickBadge>` in `app/fixtures/page.tsx`.

### Verification
- [x] 11. `pnpm tsc --noEmit`.
- [x] 12. `pnpm test`.
- [x] 13. QA: validate the 5 PickPanel states (scheduled without pick, scheduled with pick, live, finished correct, finished incorrect).
- [x] 14. Code Quality without blockers.
- [x] 15. Reviewer without blockers.
- [x] 16. Grill re-check.

### Closeout
- [ ] 17. `spec-closeout`.
- [ ] 18. PR toward `main`.

## Definition of Done

- [ ] Pick works end-to-end: saves, locks, and verifies correctly.
- [ ] The 5 PickPanel states are visually correct.
- [ ] Badge in fixture list visible.
- [ ] `pnpm tsc --noEmit` and `pnpm test` pass.
- [ ] `pnpm spec:check` passes.
- [ ] `specs/README.md` updated.
- [ ] Vercel preview reviewed.
