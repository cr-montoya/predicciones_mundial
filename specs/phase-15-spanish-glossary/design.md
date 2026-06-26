# Design: Phase 15 — Latin American Spanish and Market Glossary

## Approach

Centralize market language in a typed dictionary and have the UI consume that content
from a single place. This phase should improve comprehension without adding visual noise:
the app remains a broadcast terminal, not a help screen.

## Proposed Architecture

```
lib/content/markets-es.ts
   -> labels, descriptions, examples, limitations

components/market-info.tsx
   -> reusable info button

components/market-section.tsx
components/top-markets.tsx
app/fixtures/[id]/page.tsx
   -> consume getMarketCopy(market)
```

## Market Dictionary

Create a contract like:

```ts
export interface MarketCopy {
  label: string
  shortLabel: string
  description: string
  example: string
  confidenceNote?: string
}

export type MarketCopyKey =
  | 'result_1x2'
  | 'double_chance'
  | 'over_under_goals'
  | 'btts'
  | 'exact_score'
  | 'clean_sheet'
  | 'cards'
  | 'corners'
  | 'scorers'
```

The dictionary must cover current markets even if some are not yet visible.
This avoids rework in Phase 16.

## Suggested Base Copy

- `1X2`: Match result.
- `Double chance`: Two outcomes covered in a single reading.
- `Over/Under goals`: Probability that the match will exceed or not exceed a goal line.
- `Both teams score`: Probability that both teams score at least one goal.
- `Exact score`: Most likely scorelines according to the Poisson matrix.
- `Win to nil`: Team wins and concedes no goals.
- `Cards`: Discipline estimate; confidence usually lower.
- `Corners`: Corner estimate; highly dependent on match style.
- `Top scorers`: Probability associated with players, expected minutes, and team lambda.

## Info Component

Recommended pattern:

- Small `i` or `?` icon button.
- On desktop: popover/tooltip next to the market title.
- On mobile: compact panel below the section header or a lightweight dialog if a pattern already exists.
- Close with click outside or a button.
- No long text visible by default.

## Formatting and Localization

Create helpers if needed:

- `formatPercent(value)`.
- `formatLocalTime(iso, locale = 'es-CO')`.
- `formatLocalDate(iso, locale = 'es-CO')`.

Avoid mixed formats inside components.

## UX and Design

- Maintain data hierarchy: probability first, then explanation.
- The info button must not compete with the main number.
- Explanations should be 1–3 sentences.
- Do not use language like "safe bet", "guaranteed", or "recommended".
- Keep the entertainment disclaimer visible.

## Expected Impact

Probable files:

- `lib/content/markets-es.ts`
- `components/market-info.tsx`
- `components/market-section.tsx`
- `components/top-markets.tsx`
- `components/fixtures-today.tsx`
- `components/candidates.tsx`
- `app/fixtures/page.tsx`
- `app/fixtures/[id]/page.tsx`
- `app/groups/page.tsx`

## Risks

### Unnecessary Client Components

The popover may force `"use client"` on large components.

Mitigation: isolate interactivity in `MarketInfo`.

### Copy Too Long

May break mobile layout.

Mitigation: compact copy, controlled visual truncation, and responsive review.

### Incomplete Translation

Loose English strings may remain.

Mitigation: QA search for known strings: `Over`, `Under`, `Draw`, `Home`,
`Away`, `BTTS`, `Clean sheet`, `Winner`.
