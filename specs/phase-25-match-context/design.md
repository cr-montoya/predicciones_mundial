# phase-25-match-context — Design

## Position in `app/fixtures/[id]/page.tsx`

The CONTEXT section goes between `<FixtureHeader>` and the prediction markets.
It frames the prediction with background before showing probabilities.

## New Files

| File | Description |
|---|---|
| `lib/agents/h2h-loader.ts` | Agent: fetch H2H from football-data.org with timeout and fallback |
| `components/match-context.tsx` | Server Component: recent form + H2H |
| `components/form-strip.tsx` | W/D/L badges for a team's recent matches |

## Modified Files

| File | Change |
|---|---|
| `app/fixtures/[id]/page.tsx` | Add `<MatchContext>` between header and markets |

## `h2h-loader.ts` Contract

```ts
export interface H2HMatch {
  date: string      // ISO
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
}

export async function loadH2H(
  teamAId: number,
  teamBId: number,
): Promise<H2HMatch[]>  // max 5, empty if fails or no data
```

Timeout: 2000ms via `apiFetch({ timeoutMs: 2000 })` (uses `AbortSignal.timeout`, existing pattern — avoids hung requests).
If fails or times out → returns `[]`. Wrapped in `try/catch`.

Null-safety: after filtering `status === 'FINISHED'`, discard matches where
`score.fullTime.home === null || score.fullTime.away === null` (edge case: AWARDED matches).

## Recent Form

Calculated from `loadFixtures()` (already available in the server component) filtering
by `homeTeamId | awayTeamId` with `status === 'finished'`, sorted by
`kickoffUtc` descending. Max. 3 matches per team.

## Visual Design

### Base Visual System

| Token | Value |
|---|---|
| Card bg | `#12141a` (`var(--card-bg)`) |
| Card border | `1px solid rgba(255,255,255,0.04)` (`var(--border)`) |
| Text | `var(--text)` |
| Muted | `var(--muted)` `#6b6d75` |
| Accent | `var(--accent)` `#FFDB00` |
| Win (W) | `#02B906` bg `rgba(2,185,6,0.12)` |
| Draw (D) | `#6b6d75` bg `rgba(107,109,117,0.12)` ← NOT yellow |
| Loss (L) | `#ef4444` bg `rgba(239,68,68,0.12)` |

### CONTEXT Section

Section header (`text-xs tracking-widest font-bold uppercase`, color `var(--accent)`, `border-b pb-2`). Copy: `CONTEXT`. The entire section is omitted if form and H2H are both empty.

Insert in `app/fixtures/[id]/page.tsx` between the PickPanel block (line 285) and markets, using `<FadeIn delay={0.08}>`.

### Recent Form

Subsection label: `text-[11px] font-bold uppercase tracking-wider` color `var(--muted)`. Copy: `Recent form` (no explanatory parentheses).

Two card rows (one per team). Structure of each row:
- Card: `background: var(--card-bg)`, border `var(--border)`, `borderRadius: 8`, `padding: 10px 14px`, flex row, gap-3.
- Name column: `width: 132, flexShrink: 0` — flag (emoji, fontSize 15) + name (text-[13px] font-medium, ellipsis).
- Badges: `WdlBadge` (see below), gap-1.5. Max 3, most recent on the left.

Badge `WdlBadge` — **extract** from the existing component in `team-fixtures.tsx` lines 28-51 to `components/wdl-badge.tsx` and reuse in both places:
- Box: `width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700`, inline-flex centered.
- W green / D grey / L red (colors above). Draw is grey, NOT yellow.

If only one team has matches: show the other team's row with faint text `No matches yet`. If neither has matches: do not render the subsection.

### Meetings in This World Cup

Render as result-cards (NOT HTML table). Subsection label same as form. Copy: `Meetings in this World Cup`.

Each meeting → card with structure:
1. **Stage tag** (`text-[10px] font-bold uppercase tracking-wider` muted, bg `rgba(255,255,255,0.04)`, borderRadius 3, padding `2px 6px`, `flexShrink: 0`).
2. **Centered score**: home name (flex-1 text-right ellipsis) + score (`text-[15px] font-bold tabular-nums`, muted dash `–`) + away name (flex-1 text-left ellipsis).

Score: `3 – 0` (en-dash muted). NOT `3 - 0`.

Stage labels:

| Stage code FD | Label |
|---|---|
| `GROUP_STAGE` | `Group stage` |
| `ROUND_OF_32` | `Round of 32` |
| `ROUND_OF_16` | `Round of 16` |
| `QUARTER_FINALS` | `Quarter-finals` |
| `SEMI_FINALS` | `Semi-finals` |
| `THIRD_PLACE` | `3rd place` |
| `FINAL` | `Final` |

Shown only if there is at least one meeting. Mainly visible from the Round of 16 onward.

## Security and Runtime

- `h2h-loader.ts` is an Agent: uses `FOOTBALLDATA_KEY` server-side, never exposed.
- 2000ms timeout with `apiFetch({ timeoutMs: 2000 })` (AbortSignal.timeout, project pattern).
- If API fails or returns 429 → returns `[]` silently.

## Testing Strategy

- Form: team with 2 played matches → form with 2 badges.
- Form: team without matches → form subsection not rendered.
- H2H: mock empty API response → H2H section does not appear.
- H2H: 2s timeout → page renders without H2H section.
- `pnpm tsc --noEmit` validates the `H2HMatch` contract.
