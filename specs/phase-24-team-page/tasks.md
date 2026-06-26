# phase-24-team-page — Tasks

## Status

pending

## Tasks

### Pre-implementation
- [ ] 1. `spec-review`.
- [ ] 2. `data-contract`: confirm top squad interface and how players are filtered.
- [ ] 3. Design: approve page layout and rating bars.
- [ ] 4. Grill.

### Implementation
- [ ] 5. Create `app/teams/[id]/page.tsx` with `notFound()` for invalid IDs.
- [ ] 6. Create `components/model-rating-bars.tsx`.
- [ ] 7. Create `components/team-fixtures.tsx`.
- [ ] 8. Create `components/squad-top.tsx`.
- [ ] 9. Add links to `/teams/[id]` in fixture headers and groups table.

### Verification
- [ ] 10. `pnpm tsc --noEmit` and `pnpm build`.
- [ ] 11. QA: test with teams with and without squad data.
- [ ] 12. QA: invalid link (`/teams/9999`) calls notFound.
- [ ] 13. Code Quality and Reviewer.

### Closeout
- [ ] 14. `spec-closeout` and PR.

## Definition of Done

- [ ] `/teams/[id]` renders for all tournament teams.
- [ ] Rating, fixtures, and top squad visible.
- [ ] Links from fixtures and groups work.
- [ ] `pnpm build` passes.
- [ ] Vercel preview reviewed.
