# Portfolio Rebrand — Tasks

## Pre-implementation

- [ ] **Spec Review**: validate requirements and design.
- [ ] **Grill**: run Grill gate to detect blockers.
- [ ] **Design**: review README structure and metadata copy.

## Developer — package.json & Metadata

- [ ] Update `package.json` `name` to `wc2026-prediction-simulator`.
- [ ] Update `app/layout.tsx` title, description, and OG tags to English.

## Developer — README

- [ ] Rewrite `README.md` in English:
      - Product name: "World Cup 2026 Prediction Simulator"
      - Tagline: "AI-assisted statistical football analytics app"
      - What it does section
      - Stack section (Next.js 16, React, TypeScript, Tailwind, Vitest, Vercel ISR,
        custom Poisson + Monte Carlo model)
      - Local setup section (pnpm install, .env.local, pnpm dev)
      - Architecture section (layer harness diagram)
      - Markets & features section
      - Commands section
      - Deploy section
      - Disclaimer (entertainment only, no gambling)

## Developer — Code Comments

- [ ] Translate Spanish comments in `lib/types.ts`.
- [ ] Translate Spanish comments in `lib/middleware/get-ip.ts`.
- [ ] Translate Spanish comments in `lib/agents/strength-batch.ts`.
- [ ] Translate Spanish comments in `lib/agents/__tests__/live-loader-predictions.test.ts`.
- [ ] Translate Spanish comments in `lib/content/markets-es.ts`.
- [ ] Run `grep -rn "// " lib/ components/ app/ scripts/ --include="*.ts" --include="*.tsx"`
      and verify no Spanish comments remain.

## Developer — Spec Files

- [ ] Translate `specs/README.md` to English.
- [ ] Translate all spec files under `specs/phase-00-setup/`.
- [ ] Translate all spec files under `specs/phase-01-ingesta-db/`.
- [ ] Translate all spec files under `specs/phase-02-modelo-prediccion/`.
- [ ] Translate all spec files under `specs/phase-03-refresh-demanda/`.
- [ ] Translate all spec files under `specs/phase-04-dashboard/`.
- [ ] Translate all spec files under `specs/phase-05-pulido/`.
- [ ] Translate all spec files under `specs/phase-06-diseno-broadcast/`.
- [ ] Translate all spec files under `specs/phase-07-branding-world-cup/`.
- [ ] Translate all spec files under `specs/phase-08-datos-historicos/`.
- [ ] Translate all spec files under `specs/phase-09-cloudflare-d1/`.
- [ ] Translate all spec files under `specs/phase-10-hardening-auth/`.
- [ ] Translate all spec files under `specs/phase-11-deploy-vercel-isr/`.
- [ ] Translate all spec files under `specs/phase-12-datos-historicos-enriquecidos/`.
- [ ] Translate all spec files under `specs/phase-13-predicciones-fixture-cards/`.
- [ ] Translate all spec files under `specs/phase-14-sistema-visual-design/`.
- [ ] Translate all spec files under `specs/phase-15-espanol-glosario/`.
- [ ] Translate all spec files under `specs/phase-16-goleadores-mercados/`.
- [ ] Translate all spec files under `specs/phase-17-odds-implicitas/`.
- [ ] Translate all spec files under `specs/phase-18-jugadores-lineups/`.
- [ ] Translate all spec files under `specs/phase-19-picks/`.
- [ ] Translate all spec files under `specs/phase-20-accuracy/`.
- [ ] Translate all spec files under `specs/phase-21-bracket/`.
- [ ] Translate all spec files under `specs/phase-22-mis-picks/`.
- [ ] Translate all spec files under `specs/phase-23-share-card/`.
- [ ] Translate all spec files under `specs/phase-24-team-page/`.
- [ ] Translate all spec files under `specs/phase-25-match-context/`.
- [ ] Translate all spec files under `specs/phase-26-picks-reminder/`.
- [ ] Translate all spec files under `specs/phase-27-live-top-scorers/`.
- [ ] Translate all spec files under `specs/auto-refresh-workers/`.
- [ ] Translate all spec files under `specs/fix-better-sqlite3-devdep/`.
- [ ] Translate all spec files under `specs/fix-flags-display/`.
- [ ] Translate all spec files under `specs/fix-goleadores-empty-state/`.
- [ ] Translate all spec files under `specs/vercel-env-csp/`.

## QA

- [ ] `pnpm tsc --noEmit` — no errors.
- [ ] `pnpm test` — no regressions.
- [ ] `pnpm build` — clean build.
- [ ] `pnpm spec:check` — passes.
- [ ] Verify `<title>` in Vercel preview HTML is "World Cup 2026 Prediction Simulator".
- [ ] Verify `<meta name="description">` is in English.
- [ ] Confirm no Spanish comments remain in code files.

## Code Quality

- [ ] No behavioral changes — only text/comments were modified.
- [ ] Route names and data keys are unchanged.
- [ ] No identifier renames that could break imports.

## Reviewer

- [ ] All changed files are documentation or metadata only (README, comments, specs).
- [ ] No harness violations introduced.
- [ ] No runtime code logic changed.

## Design

- [ ] README renders well on GitHub (headings, code blocks, lists).
- [ ] Vercel preview metadata correct in social share preview.

## Spec Closeout

- [ ] `specs/README.md` updated with phase-29 entry.
- [ ] `pnpm spec:check` passes.
- [ ] All acceptance criteria from `requirements.md` checked.
