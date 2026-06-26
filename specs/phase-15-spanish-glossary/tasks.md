# Tasks: Phase 15 — Latin American Spanish and Market Glossary

## 1. Design

- [ ] Define the visual pattern for the info button.
- [ ] Define desktop/mobile behavior.
- [ ] Validate that the glossary does not compete with the main numbers.
- [ ] Review the entertainment disclaimer on key pages.

## 2. Analyst

- [ ] Validate market descriptions.
- [ ] Validate probability reading examples.
- [ ] Flag markets with naturally low confidence: cards, corners, top scorers.
- [ ] Confirm copy does not suggest financial advice.

## 3. Developer

- [ ] Create branch from `main`: `phase/15-spanish-market-info`.
- [ ] Create `lib/content/markets-es.ts`.
- [ ] Create typed helper `getMarketCopy`.
- [ ] Create `MarketInfo` component.
- [ ] Connect glossary to market sections.
- [ ] Translate home, fixtures, groups, candidates, empty states, and visible errors.
- [ ] Normalize dates, times, and percentages.
- [ ] Keep client components small and isolated.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Review `/`.
- [ ] Review `/fixtures`.
- [ ] Review `/fixtures/[id]`.
- [ ] Review `/groups`.
- [ ] Search for critical English strings.
- [ ] Test info buttons on desktop.
- [ ] Test info buttons on mobile.

## 5. Reviewer

- [ ] No market strings are unnecessarily duplicated.
- [ ] No providers/API/server env in client components.
- [ ] UI maintains the layer harness.
- [ ] New components are small and reusable.

## 6. Security

- [ ] No secrets exposed.
- [ ] No `dangerouslySetInnerHTML` used.
- [ ] Popover/dialog does not introduce unsafe external URLs.

## 7. Owner Review

- [ ] Review Vercel preview.
- [ ] Validate LATAM tone.
- [ ] Validate market comprehension.
- [ ] Approve PR before merge.
