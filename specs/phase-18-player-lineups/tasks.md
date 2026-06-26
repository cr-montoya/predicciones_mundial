# Tasks: Phase 18 - Enriched Player Data

## 1. Analyst

- [x] Redefine `scorers.ts` contract with `starterProbability`.
- [x] Validate values for injured/doubtful/suspended.
- [x] Define confidence rules.
- [x] Validate effect of lineup on probabilities.

## 2. Design

- [x] Define confirmed lineup badge.
- [x] Define `Limited data` state.
- [x] Define visual timestamp.
- [x] Review mobile in fixture detail.

## 3. Developer

- [x] Create branch from `main`: `phase/18-jugadores-lineups`.
- [x] Create `lib/agents/lineups-loader.ts`.
- [x] Normalize lineups per `fixtureId`.
- [x] Integrate injuries/suspensions if source available.
- [x] Update `scorers.ts` contract.
- [ ] Add manual near-kickoff Server Action — DEFERRED: On-Demand Revalidation left for a future phase.
- [x] Update top scorer UI.
- [x] Add no-lineup fallback.

## 4. QA

- [x] `pnpm tsc --noEmit` — PASS.
- [x] `pnpm test` — 361/361 PASS.
- [x] `pnpm build` — PASS.
- [x] Complete lineup test.
- [x] No lineup test.
- [x] Injured player test.
- [x] Suspended player test.
- [ ] Smoke test fixture detail near-kickoff — pending Vercel preview.

## 5. Reviewer

- [x] Agents concentrate external calls.
- [x] Models/skills remain pure.
- [x] Server Action protected if exists — N/A (deferred).
- [x] UI does not import providers.

## 6. Security

- [x] API key only server-side.
- [x] Rate limit on manual refresh — N/A (Server Action deferred).
- [x] No logs of sensitive payloads.
- [x] No unprotected public endpoint that burns quota.

## 7. Owner Review

- [ ] Review Vercel preview.
- [ ] Validate confidence copy.
- [ ] Validate that lineup improvement is understood.
- [ ] Approve PR before merge.
