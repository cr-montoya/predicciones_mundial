# phase-22-mis-picks — Tasks

## Status

pending

## Tasks

### Pre-implementation
- [ ] 1. `spec-review`.
- [ ] 2. `data-contract`: confirm interface between Server Component (fixtures) and Client Component (picks).
- [ ] 3. Design: approve wireframe for counter and pick rows.
- [ ] 4. Confirm phase-19 is implemented (picks in localStorage).

### Implementation
- [ ] 5. Create `app/mis-picks/page.tsx` (shell with loadFixtures).
- [ ] 6. Create `components/mis-picks-client.tsx`.
- [ ] 7. Create `components/pick-result-row.tsx`.
- [ ] 8. Add link to `/mis-picks` in nav or home.

### Verification
- [ ] 9. `pnpm tsc --noEmit`.
- [ ] 10. QA: empty state, pending picks, correct/incorrect resolved picks.
- [ ] 11. Code Quality and Reviewer.

### Closeout
- [ ] 12. `spec-closeout` and PR.

## Definition of Done

- [ ] `/mis-picks` renders correctly with and without picks.
- [ ] Accuracy counter correct.
- [ ] Empty state with CTA visible.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] Vercel preview reviewed.
