# Tasks: Phase 17 - Implicit Bookmaker Probabilities

## 1. Analyst

- [x] Validate odd → probability formula.
- [x] Validate overround adjustment.
- [x] Define `VALOR+`, `VALOR-`, `NEUTRO` thresholds.
- [x] Define exact MVP markets.
- [x] Validate technical copy to avoid financial promise.

## 2. Design

- [x] Define differential badge/column.
- [x] Define states without available odds.
- [x] Validate colors to not suggest "bet".
- [x] Review mobile and fixture detail.

## 3. Developer

- [x] Create branch from `main`: `phase/17-odds-implicitas`.
- [x] Add server-side env var for The Odds API.
- [x] Create `lib/agents/odds-loader.ts`.
- [x] Create odds/teams normalizer.
- [x] Create `lib/model/skills/value-calc.ts`.
- [x] Integrate odds in 1X2 and O/U 2.5 markets.
- [x] Update UI with differential.
- [x] Add fallback when no odds available.

## 4. QA

- [x] `pnpm tsc --noEmit`.
- [x] `pnpm test`.
- [x] `pnpm build`.
- [x] Overround tests.
- [x] Tests for diff in range [-1, 1].
- [x] Label tests.
- [ ] Verify fixture with odds. (pending: requires THE_ODDS_API_KEY in Vercel preview)
- [ ] Verify fixture without odds. (pending: requires Vercel preview)

## 5. Reviewer

- [x] Skills without I/O.
- [x] Agent separate from UI/models.
- [x] No API key in client.
- [x] Copy maintains informational tone.

## 6. Security

- [x] API key does not appear in git.
- [x] API key does not appear in logs.
- [x] No browser calls to The Odds API.
- [x] Rate limit/quota documented.

## 7. Owner Review

- [ ] Add THE_ODDS_API_KEY in Vercel env vars before preview.
- [ ] Review Vercel preview.
- [ ] Validate differential clarity.
- [ ] Validate it does not look like a betting recommendation.
- [ ] Approve PR before merge.
