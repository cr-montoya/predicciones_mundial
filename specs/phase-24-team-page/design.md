# phase-24-team-page — Design

## Route

`app/teams/[id]/page.tsx` — Server Component, `revalidate = 3600`.

## Architecture

```
app/teams/[id]/page.tsx  (Server Component)
  ↓ buildStaticTeams() → teamMap → team
  ↓ loadFixtures() → filter by homeTeamId | awayTeamId
  ↓ squadsByTeamId[id] → top squad
  → <TeamHeader> <ModelRatingBars> <TeamFixtures> <SquadTop>
```

## New Files

| File | Description |
|---|---|
| `app/teams/[id]/page.tsx` | Main team page |
| `components/model-rating-bars.tsx` | Visualization of attackStrength / defenseStrength |
| `components/team-fixtures.tsx` | List of team matches with result/prediction |
| `components/squad-top.tsx` | Top players of the team by model |

## Modified Files

| File | Change |
|---|---|
| `app/fixtures/[id]/page.tsx` | Team names become links to `/teams/[id]` |
| `app/groups/page.tsx` | Team names in table link to `/teams/[id]` |

## Visual Design

### ModelRatingBars

```
MODEL RATING
Attack   ████████░░  1.32  (above average)
Defense  █████░░░░░  0.88  (better than average)
```

- Relative bar: `(strength / 2.0) * 100%` for visual scale 0–2.
- Color: gold `#FFDB00` if > 1.0, grey if ≤ 1.0.
- Subtext: "above average" / "average" / "below average".

### TeamFixtures

List of team matches sorted chronologically:
- Scheduled: time + opponent + model top-1 prediction.
- Finished: actual score + W/D/L badge.

### SquadTop

Player grid (max. 8): name + position + goals per 90 min rate.
Only FW and MF with `goalsPerMinute > 0`.

## Security and Runtime

- Server Component with ISR `revalidate = 3600`. No secrets to client.
- `FOOTBALLDATA_KEY` not used on this page (all data is static).
- `notFound()` for invalid IDs; no internal data exposed.

## Testing Strategy

- `notFound()` for non-existent ID: `/teams/9999` → 404.
- Team without squad in squads.json → `<SquadTop>` not rendered.
- Links from fixture and groups → navigate correctly.
- `pnpm build` is the main gate.
