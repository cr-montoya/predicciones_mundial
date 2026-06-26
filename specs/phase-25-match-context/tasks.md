# phase-25-match-context — Tasks

## Status

pending

## Tasks

### Pre-implementation
- [x] 1. `spec-review`.
- [x] 2. Analyst: validate that showing H2H context does not imply a model change.
- [x] 3. `data-contract`: formalize `H2HMatch` and the football-data.org endpoint to use.
- [x] 4. Design: approve form and H2H design.
- [x] 5. Grill: verify H2H endpoint availability on the current API plan.

### Implementation
- [x] 6. Extract `WdlBadge` to `components/wdl-badge.tsx` (shared); update team-fixtures.tsx.
- [x] 7. Create `lib/agents/h2h-loader.ts` with timeout and empty fallback.
- [x] 8. Create `components/form-strip.tsx`.
- [x] 9. Create `components/match-context.tsx`.
- [x] 10. Integrate `<MatchContext>` in `app/fixtures/[id]/page.tsx`.

### Verification
- [x] 11. `pnpm tsc --noEmit` — PASS.
- [x] 12. `pnpm test` — 361/361 PASS.
- [x] 13. `pnpm build` — PASS.
- [x] 14. QA manual: h2h catch all errors → `[]`, FINISHED+null guard+opponent filters, MatchContext position.
- [x] 15. Code Quality — PASS (no blockers).
- [x] 16. Reviewer — PASS (harness compliant).

### Closeout
- [x] 17. `spec-closeout` — in_review, PR pending.
- [x] 18. PR #18 approved and merged by owner.
- [x] 19. Mark `completed` post-merge.

## Definition of Done

- [ ] Recent form visible when matches have been played.
- [ ] H2H visible if there is data; silently omitted if it fails.
- [ ] No performance degradation (H2H timeout ≤ 2s).
- [ ] `pnpm tsc --noEmit` passes.
- [ ] Vercel preview reviewed.
