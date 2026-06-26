---
status: completed
phase:
owner: cristian
branch: fix/flags-display
pr:
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: passed
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: not_applicable
  reviewer: passed
---

# fix-flags-display — Requirements

## Status

completed

## Objective

Fix two flag display problems in the app:

1. **Players with flag**: Golden Boot candidates show their country flag next to the name.
   Players should not have a flag; flags apply only to teams/national sides.
2. **Countries without flag**: Cape Verde Islands, Jordan, and Congo DR appear without
   a flag because their names in `teams-seed.ts` do not match entries in
   `lib/utils/flags.ts` or simply do not exist there.

## Context

`lib/utils/flags.ts` defines the `FLAGS` map which includes both national team names
and individual player names (Mbappé, Messi, Ronaldo, etc.).

The component `components/candidates.tsx` calls `getFlag(name)` with the player name
to show the flag in the "Golden Boot Candidates" section. This causes well-known players
to show their country flag, which is incorrect: the ranking is of individual players,
not national sides.

Regarding countries without flags, the canonical name in `teams-seed.ts` is:
- `"Cape Verde Islands"` → FLAGS has `"Cape Verde"` (mismatch)
- `"Jordan"` → does not exist in FLAGS
- `"Congo DR"` → does not exist in FLAGS

## Scope

- Remove all individual player entries from the FLAGS map in `lib/utils/flags.ts`.
- Add entry `"Cape Verde Islands": '🇨🇻'` to FLAGS (or fix the existing one).
- Add entry `"Jordan": '🇯🇴'` to FLAGS.
- Add entry `"Congo DR": '🇨🇩'` to FLAGS.

## Out of Scope

- Changing the flag display logic in `candidates.tsx` (it simply benefits from the fix
  when player entries are removed from FLAGS).
- Adding flags to components that do not show them today.
- Fixing team names in other parts of the code.

## Requirements

1. No individual player appears with a flag in the "Golden Boot Candidates" section
   of the home.
2. Cape Verde Islands, Jordan, and Congo DR show their correct flag in the groups
   table and in the fixtures list.
3. All other existing flags are not affected.

## Acceptance Criteria

- [ ] Golden Boot Candidates: no player shows a flag.
- [ ] Group table group H: Cape Verde Islands shows 🇨🇻.
- [ ] Group table group J: Jordan shows 🇯🇴.
- [ ] Group table group K: Congo DR shows 🇨🇩.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes.

## Risks and Assumptions

- Removing player entries from FLAGS does not affect anything else; `candidates.tsx`
  simply will not render the flag `<span>` when `flag` is `''`.
- If in the future flags are desired for players, it must be done from the component
  that displays them (passing the player's teamId), not from FLAGS.
