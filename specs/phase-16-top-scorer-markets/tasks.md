# Tasks: Phase 16 — Top Scorers and Extended Markets

## 1. Analyst

- [ ] Define team totals contract.
- [ ] Define simple combos contract.
- [ ] Define minimum top scorer contract.
- [ ] Define confidence thresholds.
- [ ] Confirm which markets are shown in MVP.

## 2. Design

- [ ] Define visual hierarchy for the enriched fixture detail.
- [ ] Define pattern for collapsible sections.
- [ ] Define UI for low confidence/unavailable.
- [ ] Validate mobile and capture mode.

## 3. Developer

- [ ] Create branch from `main`: `phase/16-scorers-extended-markets`.
- [ ] Add pure skills for team totals.
- [ ] Add pure skills for combos.
- [ ] Extend `computeMatchOutputs` with new markets.
- [ ] Add scorer model/skill if dataset is available.
- [ ] Create "top scorers unavailable" fallback if no data.
- [ ] Update fixture detail.
- [ ] Connect market copy from `markets-es.ts`.
- [ ] Keep calculations on server/ISR runtime.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Team totals tests.
- [ ] Combos tests.
- [ ] Top scorer tests with complete data.
- [ ] Top scorer tests without data.
- [ ] Fixture detail renders with scheduled match.
- [ ] Fixture detail renders with finished match.

## 5. Reviewer

- [ ] Skills without DB/API/fetch imports.
- [ ] Models without external calls.
- [ ] Client components without model/provider imports.
- [ ] `modelVersion` updated if contract changes.
- [ ] No market saturation in UI.

## 6. Security

- [ ] API keys only server-side.
- [ ] No logs of sensitive payloads.
- [ ] No unnecessary public endpoints added.
- [ ] Rate limit/API quota considered.

## 7. Owner Review

- [ ] Review Vercel preview.
- [ ] Validate clarity of new markets.
- [ ] Validate that top scorers do not promise false precision.
- [ ] Approve PR before merge.
