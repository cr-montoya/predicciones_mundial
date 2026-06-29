---
status: active
phase: 29
owner: cristian
branch: phase/29-portfolio-rebrand
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: passed
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Portfolio Rebrand — Requirements

## Status

active

## Objective

Rebrand and polish the project so it can be showcased as a professional portfolio
piece under the name **"World Cup 2026 Prediction Simulator"** with the tagline
**"AI-assisted statistical football analytics app"**. This involves updating the
README, translating all code-internal text (comments, variable names where they are
Spanish words, spec documentation) to English, and aligning the project's public
presentation with an international audience.

## Background

The project was built in Spanish for a Latin American audience. For portfolio
purposes — reaching recruiters, developers, and technical reviewers who may not
speak Spanish — the internal documentation, code comments, and project metadata
need to be in English. The user-facing app UI is handled separately by phase-28-i18n.

## Scope

- Rewrite `README.md` in English with the new product name, tagline, and clear
  technical description.
- Translate all Spanish code comments in `lib/`, `components/`, `app/`, and `scripts/`
  to English.
- Translate all spec files (`specs/*/requirements.md`, `design.md`, `tasks.md`) to English.
- Translate `specs/README.md` (the spec index) to English.
- Update `package.json` `name` field to `wc2026-prediction-simulator`.
- Update `<title>` and `<meta description>` in `app/layout.tsx` to English.
- Update Open Graph tags to use the English product name and tagline.
- Update any Spanish strings in `next.config.ts` comments or configuration.

## Out of Scope

- Translating user-facing UI copy (that is phase-28-i18n).
- Translating `CLAUDE.md` or `.claude/` agent/skill files (these are operational
  tools for the development workflow, not public-facing content).
- Changing any runtime behavior, routes, or data.
- Modifying the statistical model or predictions.

## Requirements

1. `README.md` must describe the project in English with:
   - Product name: "World Cup 2026 Prediction Simulator"
   - Tagline: "AI-assisted statistical football analytics app"
   - What it does (statistics, probabilities, entertainment framing)
   - Stack section
   - Local setup section
   - Architecture section
   - Commands section
   - Deploy section
   - No apuestas / gambling disclaimer in English
2. All `// comment` and `/* block */` code comments written in Spanish must be
   translated to English.
3. All spec files must be readable by a non-Spanish speaker with no meaning lost.
4. `package.json` `name` field updated to `wc2026-prediction-simulator`.
5. `app/layout.tsx` metadata updated: title, description, and OG tags in English.
6. `pnpm tsc --noEmit`, `pnpm test`, and `pnpm build` must pass after changes.

## Acceptance Criteria

- [ ] `README.md` is fully in English with the new product name and tagline.
- [ ] No Spanish comments remain in `lib/`, `components/`, `app/`, or `scripts/` files.
- [ ] All spec files are in English.
- [ ] `specs/README.md` is in English.
- [ ] `package.json` `name` is `wc2026-prediction-simulator`.
- [ ] Page `<title>` and `<meta description>` are in English.
- [ ] OG tags use the English product name.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] Vercel preview reviewed: no runtime regressions, metadata displays correctly
      in social share preview.

## Risks and Assumptions

- Some Spanish strings in code are intentional domain labels (e.g. `goleadores`,
  `fixtures`, `picks`) that are also used as route names or data keys; these must
  NOT be renamed to avoid breaking routes and API contracts.
- Spec files are documentation only; translating them carries no runtime risk.
- README changes are cosmetic and do not affect the build.
- `package.json` `name` is private (not published to npm), so renaming it is safe.
