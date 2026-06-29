# Portfolio Rebrand — Tasks

## Pre-implementation

- [x] **Spec Review**: validated requirements and design. PASSED.
- [x] **Grill**: no blockers detected. PASSED.
- [x] **Design**: README structure and metadata copy reviewed. PASSED.

## Developer — package.json & Metadata

- [x] Update `package.json` `name` to `wc2026-prediction-simulator`.
      (Was already set correctly on main.)
- [x] Update `app/layout.tsx` title, description, and OG tags to English.
      Added structured title (default + template), long-form description, openGraph, and
      twitter card metadata.

## Developer — README

- [x] `README.md` already fully in English with:
      - Product name: "World Cup 2026 Prediction Simulator"
      - Tagline: "AI-assisted statistical football analytics app"
      - What it does, Stack, Local Setup, Architecture, Markets, Commands, Deploy,
        Portfolio fit, License / Disclaimer sections.
      No changes needed.

## Developer — Code Comments

- [x] No Spanish comments found in `lib/types.ts`, `lib/middleware/get-ip.ts`,
      `lib/agents/strength-batch.ts`, `lib/agents/__tests__/live-loader-predictions.test.ts`,
      or `lib/content/markets-es.ts`. (Already in English or no comments present.)
- [x] Spanish comments and `describe`/`it` descriptions translated in:
      - `lib/data/__tests__/corners-null.test.ts`
      - `lib/data/__tests__/normalizers.test.ts`
- [x] Grep verification: no Spanish comments remain in `lib/`, `components/`, `app/`,
      or `scripts/` (only proper nouns in player names and UI copy references remain,
      which are not prose — they are code identifiers and technical references).

## Developer — Spec Files

- [x] `specs/README.md` — already in English. Updated phase-28 and phase-29 status
      from `pending` to `active`.
- [x] All older spec folders (phase-00 through phase-27, fix-*, auto-refresh-workers,
      vercel-env-csp): already fully in English or contain only proper nouns / technical
      identifiers. No Spanish prose found.
- [x] `specs/fix-bracket-confirmed-matchups/requirements.md` — translated to English.
- [x] `specs/fix-bracket-confirmed-matchups/design.md` — translated to English.
- [x] `specs/fix-bracket-confirmed-matchups/tasks.md` — translated to English.
- [x] `specs/fix-flags-display/requirements.md` and `design.md` — already in English
      (Spanish chars are player proper nouns in code snippets: Mbappé, Martínez, Núñez).

## QA

- [x] `pnpm tsc --noEmit` — clean, 0 errors.
- [x] `pnpm test` — 384/384 passed, 0 regressions.
- [x] `pnpm build` — clean build. All ISR routes preserved (no phase-28 cookies() impact
      on this branch).
- [x] `pnpm spec:check` — 10 pre-existing errors in phases 18, 20–27 (open checkboxes
      in completed specs, predating this PR). Zero new errors introduced.
      Documented as pre-existing; spec:check was already failing on main before this branch.
- [ ] Verify `<title>` in Vercel preview HTML is "World Cup 2026 Prediction Simulator".
- [ ] Verify `<meta name="description">` is in English.
- [ ] Confirm no Spanish comments remain in code files. ✅ Verified via grep.

## Code Quality

- [x] No behavioral changes — only text/comments and metadata were modified.
- [x] Route names and data keys are unchanged.
- [x] No identifier renames that could break imports.

## Reviewer

- [x] All changed files are documentation, metadata, or test descriptions only.
- [x] No harness violations introduced.
- [x] No runtime code logic changed.
- [x] Layer harness preserved.

## Design

- [x] README renders well on GitHub.
- [ ] Vercel preview metadata correct in social share preview (pending preview deploy).

## Spec Closeout

- [x] `specs/README.md` updated: phase-29 status set to `active`.
- [x] `pnpm spec:check` — pre-existing failures documented above; no new errors.
- [x] Acceptance criteria from `requirements.md` checked:
      - [x] `README.md` is fully in English with the new product name and tagline.
      - [x] No Spanish comments remain in `lib/`, `components/`, `app/`, or `scripts/`.
      - [x] All spec files are in English (with noted exception of proper nouns in code snippets).
      - [x] `specs/README.md` is in English.
      - [x] `package.json` `name` is `wc2026-prediction-simulator`.
      - [x] Page `<title>` and `<meta description>` are in English (in layout.tsx code).
      - [x] OG tags use the English product name.
      - [x] `pnpm tsc --noEmit` passes.
      - [x] `pnpm test` passes.
      - [x] `pnpm build` passes.
      - [ ] Vercel preview reviewed: no runtime regressions, metadata displays correctly
            in social share preview. (Pending after PR deploy.)
