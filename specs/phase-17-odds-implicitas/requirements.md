---
status: in_review
phase: 17
owner: cristian
branch: phase/17-odds-implicitas
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: passed
  design: passed
  data_contract: passed
  security: passed
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Requirements: Phase 17 - Implicit Bookmaker Probabilities

## Status

Pending.

## Problem

The proprietary model generates probabilities, but the user has no market context to
understand whether the AI aligns with or diverges from bookmakers. The "model vs market"
comparison is a strong content hook, as long as it is presented as informational
reference and not as a recommendation.

## Objective

Integrate implicit bookmaker probabilities via The Odds API and show, for MVP markets,
the differential between the model probability and the implied market probability.

## Functional Requirements

1. Consume odds from The Odds API with a server-side API key.
2. Normalize decimal odds to implicit probabilities.
3. Adjust overround so each comparable market sums to 1.
4. Calculate model vs market differential.
5. Label differential as `VALOR+`, `VALOR-`, or `NEUTRO`.
6. Show odds/implied probability as informational reference in UI.
7. MVP limited to:
   - 1X2.
   - Over/Under 2.5.
8. Keep the entertainment disclaimer visible.

## Non-Functional Requirements

1. The Odds API key must not reach the browser.
2. Value calculations must live in pure skills.
3. The odds agent must be separate from models/UI.
4. The free quota of 500 req/month must be respected.
5. The system must degrade if no odds are available for a match.
6. Do not use copy like "bet on", "sure", or "guaranteed".

## Success Criteria

1. Raw implied odds sum the overround (typically 1.04–1.08, not ~1) before adjustment, and exactly 1.0 after per-market adjustment.
2. Differential falls in range [-1, 1].
3. UI shows differential without appearing to be a financial recommendation.
4. `pnpm test` and `pnpm build` pass.
5. Vercel preview approved by owner before merge.
