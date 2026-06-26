---
status: completed
phase: 26
owner: cristian
branch: phase/26-picks-reminder
pr:
preview:
gates:
  spec_review: passed
  grill: not_applicable
  analyst: not_applicable
  design: passed
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-26-picks-reminder — Requirements

## Status

active

## Objective

Show an in-app reminder when matches are starting soon and the user has no pick
registered. Increases engagement with the picks feature without needing push
notifications or browser permissions.

## Context

Phase-19 allows making picks before each match. The problem is that the user may
forget to make their pick if they don't go to the specific fixture page. A discrete
banner/badge on the home or in the nav that says "There are 2 matches today without
a pick" is enough to remind them without being intrusive.

**Depends on phase-19** (picks in localStorage).

## Scope

- `<PicksReminderBanner>` banner on the home (`app/page.tsx`) that appears when:
  - There are matches with `status === 'scheduled'` whose `kickoffUtc` is in the next
    6 hours.
  - The user has no pick saved in localStorage for those matches.
- The banner shows how many upcoming matches have no pick and a link to `/fixtures`.
- The banner can be dismissed — it is saved in localStorage that it was closed
  for that day so it does not show again.
- Numeric badge in the nav Fixtures link if there are upcoming matches without a pick.
- It is a Client Component (needs localStorage and client clock).

## Out of Scope

- Browser push notifications (require explicit permission).
- Email or SMS reminder.
- Reminder for matches more than 6 hours in the future.
- Sound or vibration.

## Requirements

1. The banner appears on the home when there is ≥1 scheduled match in the next
   6 hours without the user's pick.
2. The banner shows the number of upcoming matches without a pick.
3. The banner has a close button that hides it until the next day.
4. The Fixtures nav link shows a badge with the count when applicable.
5. If there are no upcoming matches without a pick, banner and badge are not rendered.
6. Does not generate a content flash during SSR (safe hydration with `useEffect`).

## Acceptance Criteria

- [ ] Banner visible on home when there is a match in the next 6h without a pick.
- [ ] Banner does not appear if the user already has picks for all upcoming matches.
- [ ] Close button hides the banner and persists the dismiss until the next day.
- [ ] Badge in nav shows correct count.
- [ ] No content flash (hydration mismatch) during SSR.
- [ ] `pnpm tsc --noEmit` passes.

## Risks and Assumptions

- **Depends on phase-19**: without picks in localStorage, the banner would always show
  all upcoming matches as "without pick". Must be implemented after or in parallel
  with phase-19.
- The client clock may differ from the server-side kickoff time. The 6-hour window
  is wide enough to absorb reasonable timezone offsets.
- "Dismiss until the next day" is implemented by saving the last dismiss date
  in localStorage (`picks_reminder_dismissed: '2026-06-16'`).
