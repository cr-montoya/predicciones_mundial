# phase-20-accuracy — Tasks

## Status

in_review

## Tasks

### Pre-implementation
- [x] 1. `spec-review`: validate spec is ready.
- [x] 2. Analyst: approve accuracy metric (binary top-1) and `AccuracyStats` contract.
- [x] 3. `data-contract`: formalize `MatchAccuracyRecord`, `AccuracyStats`, and the `computePredictionsRetroactive` contract.
- [x] 4. Design: approve wireframes for `ModelResultCard` and `AccuracyWidget`.
- [x] 5. Grill: detect blockers before starting.

### Implementation
- [x] 6. Create `lib/skills/accuracy.ts` with `deriveActualOutcome`, `topModelCall`, `resolveModelVerdict`, `computeAccuracyStats`.
- [x] 7. Write unit tests in Vitest for accuracy skills.
- [x] 8. Add `computePredictionsRetroactive` in `lib/agents/live-loader.ts` (without finished guard).
- [x] 9. Create `components/model-result-card.tsx`.
- [x] 10. Integrate `<ModelResultCard>` in `app/fixtures/[id]/page.tsx` for finished matches.
- [x] 11. Create `components/accuracy-widget.tsx`.
- [x] 12. Integrate `<AccuracyWidget>` in `app/page.tsx` (only if `total >= 3`).

### Verification
- [x] 13. `pnpm tsc --noEmit`.
- [x] 14. `pnpm test`.
- [x] 15. QA: verify on a real finished fixture that it shows predictions + correct verdict.
- [x] 16. QA: verify home widget with coherent percentage.
- [x] 17. Code Quality without blockers. (blockers fixed: copy "apostó por" → "predijo"; "Empate ganó" → "Empate")
- [x] 18. Reviewer without blockers.
- [x] 19. Grill re-check.

### Closeout
- [x] 20. `spec-closeout`.
- [ ] 21. PR toward `main`.

## Definition of Done

- [x] Finished fixture shows retroactive prediction + model verdict.
- [x] Home shows accuracy widget when ≥ 3 matches are finished.
- [x] Accuracy skills covered by unit tests.
- [x] `pnpm tsc --noEmit` and `pnpm test` pass.
- [ ] `pnpm spec:check` passes.
- [ ] `specs/README.md` updated.
- [ ] Vercel preview reviewed by owner.
