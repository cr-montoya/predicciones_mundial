# Requirements: Phase 15 — Latin American Spanish and Market Glossary

## Problem

The app already has a strong visual base, but there are still mixed texts, technical labels,
or markets that can be confusing for a Latin American audience that is not familiar with all
sports betting terms.

The objective is not to turn the app into a sportsbook. The experience should explain
probabilities as statistical entertainment analysis.

## Objective

Translate and normalize the entire experience to Latin American Spanish, and add a market
glossary with info buttons that explain what each market means, how to read its probability,
and how reliable it is.

## Functional Requirements

1. The visible UI must be in Latin American Spanish.
2. A typed market dictionary must exist in `lib/content/markets-es.ts`.
3. Each visible market must have:
   - Short label.
   - Clear description.
   - Reading example.
   - Confidence note or limitation if applicable.
4. Market sections must include an info button/icon.
5. The info button must open a tooltip, popover, or compact panel without breaking mobile.
6. The entertainment disclaimer must be visible on market or prediction pages.
7. Dates, times, and percentages must use consistent regional formatting (`es-CO` or `es-419`).
8. Empty states and errors must be clear, short, and in Spanish.

## Non-Functional Requirements

1. Do not duplicate market strings across multiple components.
2. Keep server components as default; use small client components only for interaction.
3. Do not expose secrets or move provider logic to the client.
4. Maintain the broadcast look defined in Phase 14.
5. Do not use financial promise or betting recommendation language.
6. Maintain Vercel ISR and do not break `revalidate`.

## Success Criteria

1. No critical UI strings remain in English.
2. All visible markets are covered by the glossary.
3. Info buttons work on desktop and mobile.
4. `pnpm test` and `pnpm build` pass.
5. Vercel preview approved by owner before merge.
