---
status: completed
phase: 25
owner: cristian
branch: phase/25-match-context

pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: passed
  design: passed
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-25-match-context — Requirements

## Status

completed

## Objective

Show pre-match context on each fixture page: each team's recent results in the
tournament and the head-to-head history between both teams. Makes the prediction feel
more grounded and gives the user more reasons to read before committing their opinion.

## Context

The fixture page today shows probabilities and markets directly, but there is no
narrative context. A user arriving without knowing the teams has no way to calibrate
the prediction. Recent form and H2H context is the standard in any sports analysis.

Recent tournament form data is available in already-loaded fixtures (`loadFixtures()`).
Historical H2H would require an additional call to football-data.org
(`/teams/{id}/matches`) — this can be limited to previous World Cup matches using
the `competitions=WC` parameter.

## Scope

- "CONTEXT" section in `app/fixtures/[id]/page.tsx` above the markets.
- **Tournament form**: last N World Cup 2026 matches for each team
  (W/D/L badges), only if they have already played.
- **Meetings in this World Cup**: matches between the two teams in WC 2026,
  from football-data.org (`/teams/{id}/matches?competitions=WC`).
  - If the call fails or there is no data: silently omit the subsection.
  - Design note: in the group stage teams have not yet faced each other →
    H2H subsection is omitted. Mainly useful from the Round of 16 onward.
- Both subsections are optional: if a team has not played yet and there is no H2H,
  the "CONTEXT" section is not rendered.

## Out of Scope

- Form outside the tournament (national leagues, friendlies).
- Advanced tournament stats (possession, shots, etc.).
- AI-generated narrative context (automated text).
- Injuries or absences (requires API-Football with lineup data — phase 18).

## Requirements

1. The form section shows already-played tournament matches for each team,
   with W/D/L badge and score.
2. The H2H section shows the latest clashes in previous World Cups, if available.
3. If there is no context data, the section is not rendered.
4. The H2H call has a timeout or silent fallback to not block page render if the API
   does not respond.
5. Form data is derived from already-loaded fixtures (no extra call).

## Design Decision: H2H Scope

The `/teams/{id}/matches?competitions=WC` endpoint returns only the active season
(WC 2026). The decision was to limit H2H to "meetings in this World Cup" instead of
querying previous seasons (WC 2022, 2018) with multiple additional calls.
The H2H subsection is omitted silently when there are no meetings (group stage).

## Acceptance Criteria

- [ ] Fixture between two teams that have already played: shows form for both.
- [ ] H2H: if there is data (previous meetings in WC 2026), show up to 5 matches with date and result.
- [ ] H2H: if the call fails, the section is omitted without a visible error.
- [ ] Fixture between two teams without previous matches: CONTEXT section hidden.
- [ ] `pnpm tsc --noEmit` passes.

## Risks and Assumptions

- The H2H call adds latency to the page. Must run with `Promise.race` or a
  ~2s timeout to not degrade the fixture TTI.
- football-data.org may limit H2H by API plan. If not available on the current
  plan, H2H is marked as `deferred` and only form is shown.
- "Tournament form" has limited data in the first matchday (one match per team).
  The design must work well with 1, 2, or 3 matches shown.
