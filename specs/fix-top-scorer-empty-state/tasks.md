# fix-goleadores-empty-state — Tasks

## Status

completed

## Tasks

- [x] 1. Add `scorerMarkets.length > 0` guard and filter for empty `probabilities` in `app/fixtures/[id]/page.tsx`.
- [x] 2. Create `lib/data/squads.ts` with the top scorers for all 32 teams (goalsScored, minutesPlayed, goalsPerMinute).
- [x] 3. Update `lib/agents/live-loader.ts` to inject `homePlayers` and `awayPlayers` from `squads.ts`.
- [x] 4. Fix `translateOutcome` in `markets-es.ts` to render only the name without the ID prefix.
- [x] 5. Run `pnpm tsc --noEmit` and `pnpm test`.
- [x] 6. Verify locally that the SCORERS section shows players with probabilities.
- [x] 7. Verify in Vercel preview — PR #10 deployed and reviewed.

## Definition of Done

- [x] SCORERS section shows real players with probabilities in all unfinished matches.
- [x] "LIMITED DATA" badge still present.
- [x] `pnpm tsc --noEmit` and `pnpm test` pass.
- [x] `pnpm spec:check` passes.
- [x] `specs/README.md` updated.
- [x] Vercel preview confirmed by owner.
