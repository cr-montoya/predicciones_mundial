# Portfolio Rebrand — Design

## README Structure

The new `README.md` follows a standard open-source project README optimized for
portfolio viewers who land on the GitHub repo:

```
# World Cup 2026 Prediction Simulator
> AI-assisted statistical football analytics app

[one-line description]
[screenshot or badge links if available]

## What it does
## Stack
## Local Setup
## Architecture
## Markets & Features
## Commands
## Deploy
## License / Disclaimer
```

## package.json

Only the `name` field changes:

```json
{ "name": "wc2026-prediction-simulator" }
```

All scripts, dependencies, and devDependencies are unchanged.

## Metadata (app/layout.tsx)

Current title and description (in Spanish) are replaced:

```ts
title: 'World Cup 2026 Prediction Simulator',
description:
  'AI-assisted statistical football analytics for the 2026 FIFA World Cup. ' +
  'Explore probabilities, market projections, and tournament predictions ' +
  'powered by a custom Poisson + Monte Carlo model.',
```

OG tags follow the same copy.

## Code Comments

Target files for comment translation (identified by grepping `// ` for non-English text):

- `lib/types.ts` — domain entity section header
- `lib/middleware/get-ip.ts` — IP resolution logic comments
- `lib/agents/strength-batch.ts` — re-export compatibility note
- `lib/agents/__tests__/live-loader-predictions.test.ts` — test suite headers
- `lib/content/markets-es.ts` — inline notes about dynamic outcome keys

Strategy: translate comment text only; do not rename variables, functions,
identifiers, or file names (risk of breaking imports and routes).

## Spec Files

All `requirements.md`, `design.md`, and `tasks.md` files under `specs/` are
translated to English. The frontmatter YAML (status, gates, etc.) is already
in English and unchanged. The Markdown body text is translated preserving:

- All headings and section structure.
- All lists and checklists (checkbox state unchanged).
- All code blocks (untouched — they are code, not prose).
- All YAML frontmatter (untouched).

## Route and Key Stability

The following identifiers are Spanish by design and must NOT be changed:

| Identifier | Reason |
|---|---|
| `app/mis-picks/` | Route — changing breaks existing links |
| `lib/content/markets-es.ts` | Filename used in imports |
| `goleadores` | Domain label used as data key and UI copy |
| `fixtures` | Standard football term, same in EN/ES |
| `picks` | English loanword used in Spanish UI |
| `wdl` (win/draw/loss) | Technical abbreviation, language-neutral |

## Verification

After all changes:
1. `pnpm tsc --noEmit` — no new errors.
2. `pnpm test` — no regressions.
3. `pnpm build` — clean build.
4. Inspect `<head>` on Vercel preview to confirm updated title and meta.
