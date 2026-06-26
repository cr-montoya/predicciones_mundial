# phase-21-bracket — Tasks

## Status

pending

## Tasks

### Pre-implementation
- [ ] 1. `spec-review`.
- [ ] 2. Analyst: validate use of `ROUND_INTENSITY` for knockout probabilities.
- [ ] 3. `data-contract`: confirm `round` string format from the API and normalization.
- [ ] 4. Design: approve bracket layout on mobile and desktop.
- [ ] 5. Grill.

### Implementation
- [ ] 6. Create `app/bracket/page.tsx` with knockout fixture loading.
- [ ] 7. Create `components/bracket-matchup.tsx`.
- [ ] 8. Create `components/bracket-view.tsx` with layout by round.
- [ ] 9. Add "BRACKET" link to nav in `app/layout.tsx`.

### Verification
- [ ] 10. `pnpm tsc --noEmit` and `pnpm build`.
- [ ] 11. QA: verify empty slots, played matches, and pending matches.
- [ ] 12. Code Quality and Reviewer.
- [ ] 13. Grill re-check.

### Closeout
- [ ] 14. `spec-closeout` and PR.

## Definition of Done

- [ ] `/bracket` renders without errors.
- [ ] Matchups with actual result show it; pending ones show probabilities.
- [ ] Empty slots with "To be determined".
- [ ] Nav updated.
- [ ] `pnpm build` passes.
- [ ] Vercel preview reviewed.
