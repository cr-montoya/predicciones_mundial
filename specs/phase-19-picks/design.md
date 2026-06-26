# phase-19-picks — Design

## Layer Architecture

```
UI (Client Component: PickPanel)
  ↓ receives: Fixture (prop from Server Component parent)
  ↓ reads/writes: localStorage
  ↓ calls: resolveVerdict (pure skill)
```

No new agent or model. The skill is pure, with no network or storage.

## New Files

| File | Layer | Description |
|---|---|---|
| `lib/skills/picks.ts` | Skill | `resolveVerdict`, `deriveOutcome`. Pure functions. |
| `components/pick-panel.tsx` | UI | Client Component. 1X2 buttons, locked state, verdict. |
| `components/pick-badge.tsx` | UI | Small Client Component. "Pick made" badge on fixture cards. |

## Modified Files

| File | Change |
|---|---|
| `app/fixtures/[id]/page.tsx` | Include `<PickPanel fixture={fixture} />` above the predictions. |
| `app/fixtures/page.tsx` | Include `<PickBadge fixtureId={f.id} />` on each card. |
| `lib/skills/picks.ts` | New — see contract below. |

## Skill Contract (`lib/skills/picks.ts`)

```ts
export type PickOutcome = 'home' | 'draw' | 'away'

export interface StoredPick {
  fixtureId: number
  outcome: PickOutcome
  pickedAt: string
}

/** Converts the final score to the actual match outcome. */
export function deriveOutcome(homeGoals: number, awayGoals: number): PickOutcome {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/** Compares the user's pick with the actual result. */
export function resolveVerdict(
  pick: PickOutcome,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' {
  return pick === deriveOutcome(homeGoals, awayGoals) ? 'correct' : 'incorrect'
}
```

## Visual Design of `PickPanel`

### Scheduled state (no pick)

```
┌─────────────────────────────────────────────┐
│  YOUR PICK                                  │
│                                             │
│  [ 🏠 Home ]  [ = Draw ]  [ ✈ Away ]       │
│                                             │
│  Choose before the match starts             │
└─────────────────────────────────────────────┘
```

### Scheduled state (pick made)

```
┌─────────────────────────────────────────────┐
│  YOUR PICK                                  │
│                                             │
│  [ 🏠 Home ✓ ]  [ = Draw ]  [ ✈ Away ]     │
│                                             │
│  You can change until kickoff               │
└─────────────────────────────────────────────┘
```

### Live state (locked)

```
┌─────────────────────────────────────────────┐
│  YOUR PICK  · IN PROGRESS                  │
│                                             │
│  [ 🏠 Home ✓ ]  (locked)                  │
└─────────────────────────────────────────────┘
```

### Finished state — correct pick

```
┌─────────────────────────────────────────────┐
│  YOUR PICK  · ✓ CORRECT                    │
│                                             │
│  You chose: Home  →  Result: 2-1           │
└─────────────────────────────────────────────┘
```

### Finished state — incorrect pick

```
┌─────────────────────────────────────────────┐
│  YOUR PICK  · ✗ WRONG                      │
│                                             │
│  You chose: Draw  →  Result: 2-1           │
└─────────────────────────────────────────────┘
```

### Finished state without pick

Component is not rendered.

## Palette

- Unselected button: background `rgba(255,255,255,0.04)`, border `rgba(255,255,255,0.08)`
- Selected button: border `#FFDB00`, background `rgba(255,219,0,0.08)`
- Correct verdict: green accent `#22c55e`
- Incorrect verdict: red accent `#ef4444`
- Badge on card: gold dot `#FFDB00` + "Pick made" text

## localStorage Key

```
`pick_${fixtureId}` → JSON.stringify(StoredPick)
```

## Position in `app/fixtures/[id]/page.tsx`

`<PickPanel>` goes between the match header (teams + time) and the
AI predictions section. The user sees their pick first, then contrasts it
against the model probabilities.
