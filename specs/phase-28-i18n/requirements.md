---
status: active
phase: 28
owner: cristian
branch: phase/28-i18n
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: pending
  data_contract: not_applicable
  security: not_applicable
  qa: pending
  code_quality: pending
  reviewer: pending
---

# i18n — Requirements

## Status

active

## Objective

Add English/Spanish language toggle to the app so international viewers (portfolio
audience, recruiters, developers) can browse the app in English while Spanish-speaking
users retain their native experience.

## Background

The app is being positioned as a portfolio project under the name "World Cup 2026
Prediction Simulator — AI-assisted statistical football analytics app". An English
language option is essential for reaching an international audience and demonstrating
the product professionally without requiring Spanish fluency.

## Scope

- Language toggle UI element (EN / ES) persistent across navigation.
- All UI copy (labels, headings, section titles, market names, disclaimers, nav items)
  available in both languages.
- User language preference stored in a cookie or localStorage; no URL-based routing
  (no `/en/` or `/es/` prefixes).
- Default language: Spanish (preserves current behavior for existing users).
- Auto-detect browser language on first visit and set default accordingly.
- Market descriptions and explanatory text fully translated.
- Static data labels (team names, competition names) stay as-is — they are proper nouns.

## Out of Scope

- Server-side locale routing (next-intl `[locale]` folder structure).
- Right-to-left (RTL) language support.
- Languages beyond English and Spanish.
- Machine-translation of dynamic API content (fixture descriptions, scorer names).
- Translating the CLAUDE.md or `.claude/` operational files.

## Requirements

1. A lightweight i18n solution must be chosen that is compatible with Next.js 16 App
   Router and does not require converting the `app/` directory to `app/[locale]/`.
   Preferred approach: a React context with a hook (`useTranslation`) serving a flat
   dictionary keyed by locale.
2. Translation dictionaries must live in `lib/i18n/` as two TypeScript files:
   `en.ts` and `es.ts`, exporting a typed `Translations` object.
3. The `Translations` type must be derived from the `en.ts` dictionary so the TypeScript
   compiler enforces key parity between both languages.
4. A `LanguageProvider` client component wraps the layout and provides locale state.
5. A `LanguageToggle` component renders "EN / ES" in the nav bar and switches locale.
6. The selected locale is persisted in `localStorage` under the key `wc2026-locale`.
7. On first visit, if no preference is saved, browser `navigator.language` is used to
   pick `en` or `es`; anything else defaults to `es`.
8. All existing UI text that is currently hardcoded in components must be replaced with
   `t('key')` calls using the `useTranslation` hook.
9. Server Components that render static copy must receive locale as a prop from their
   parent Client Component or layout boundary; they must not access localStorage directly.
10. `pnpm tsc --noEmit`, `pnpm test`, and `pnpm build` must pass without errors.

## Acceptance Criteria

- [ ] Language toggle visible in the nav bar on all pages.
- [ ] Switching to EN renders all UI labels, headings, section titles, and nav items in English.
- [ ] Switching to ES restores the original Spanish copy.
- [ ] Selected language persists after page reload.
- [ ] First visit auto-detects browser language (EN for `en-*`, ES otherwise).
- [ ] Market names and descriptions translate correctly in both languages.
- [ ] No hardcoded Spanish strings remain in component JSX outside the `es.ts` dictionary.
- [ ] TypeScript compiler catches missing translation keys if a key exists in `en.ts`
      but is absent in `es.ts`.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] Vercel preview reviewed: toggle works, no layout regressions.

## Risks and Assumptions

- Some UI copy exists in `lib/content/markets-es.ts` as structured data; this file
  will need to be refactored into locale-keyed dictionaries.
- Server Components cannot directly read localStorage; the locale must be threaded
  down as a prop, which may require layout changes.
- The translation dictionary will be large; incremental migration (page by page) is
  acceptable as long as the toggle is functional end-to-end on at least the home page
  and fixture detail page before the PR is merged.
- Proper nouns (team names, player names, competition names from the API) are intentionally
  not translated.
