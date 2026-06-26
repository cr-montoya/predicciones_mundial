---
status: completed
phase: 18
owner: cristian
branch: phase/18-jugadores-lineups
pr:
preview:
gates:
  spec_review: passed
  grill: pending
  analyst: passed
  design: passed
  data_contract: passed
  security: passed
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Requirements: Phase 18 - Enriched Player Data

## Problem

Top scorer markets have low confidence because they use historical rates without knowing
whether a player will start, come off the bench, be injured, or be suspended. The distribution
changes significantly when confirmed lineups are available.

## Objective

Incorporate confirmed lineups and injury/suspension data to improve the confidence of
top scorer markets, without exposing API keys to the client and without breaking Vercel ISR.

## Functional Requirements

1. Fetch lineups from API-Football when the match is close to kickoff.
2. Fetch injuries/suspensions when the source allows it.
3. Store/cache lineups per `fixtureId`.
4. Pass optional lineup to the top scorer model.
5. If there is a confirmed lineup, filter starters and use `starterProbability = 1.0`.
6. If there is no lineup, use historical fallback with estimated `starterProbability`.
7. If a player is injured/suspended, lower or zero out their probability.
8. Show in UI whether the lineup is confirmed and timestamp.

## Non-Functional Requirements

1. API-Football must only be called from server/agents.
2. Client components do not import providers or env vars.
3. The top scorer market must degrade without blocking the page.
4. API quota must be respected.
5. Confidence must reflect data quality.
6. Near-kickoff manual refresh/Server Action must be protected.

## Success Criteria

1. With confirmed lineup, top scorers use only confirmed starters.
2. Without lineup, UI shows low confidence or limited data.
3. With injury/suspension, affected player does not appear as a strong pick.
4. Tests cover complete lineup, no lineup, and injured player scenarios.
5. `pnpm test` and `pnpm build` pass.
6. Vercel preview approved by owner before merge.
