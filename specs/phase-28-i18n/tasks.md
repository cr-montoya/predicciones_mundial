# i18n — Tasks

## Pre-implementation

- [x] **Spec Review**: passed — no blockers.
- [x] **Grill**: passed — CLEAR TO IMPLEMENT.
- [ ] **Design**: review LanguageToggle placement and visual style (pending).

## Developer — Infrastructure

- [x] Create `lib/i18n/en.ts` with all English strings (nav, hero, markets, labels,
      disclaimers, section titles, empty states, pick labels).
- [x] Create `lib/i18n/es.ts` mirroring every key from `en.ts` with Spanish copy
      extracted from current components.
- [x] Create `lib/i18n/types.ts` exporting `Translations` and `Locale` types.
- [x] Create `lib/i18n/context.tsx` with `LanguageProvider` and `useLanguage` hook.
      - Read `localStorage['wc2026-locale']` on mount.
      - Detect browser language if no preference saved.
      - Default to `'es'` if language is not `en` or `es`.
      - Persist changes to `localStorage` and a cookie (`wc2026-locale`).
- [x] Create `lib/i18n/hook.ts` exporting `useTranslation()`.

## Developer — Components

- [x] Create `components/language-toggle.tsx` (Client Component).
      - Renders `[ ES | EN ]` pill.
      - Active locale highlighted.
      - Calls `setLocale` on click.
- [x] Add `LanguageToggle` to `components/nav.tsx`.
- [x] Wrap `app/layout.tsx` with `LanguageProvider`.

## Developer — UI Migration

- [x] Migrate `components/nav.tsx` strings to `useTranslation`.
- [x] Migrate `components/hero.tsx` strings (converted to Client Component).
- [x] Migrate `components/disclaimer-banner.tsx`.
- [x] Migrate `components/picks-reminder-banner.tsx`.
- [ ] Migrate `components/market-section.tsx` and `components/market-info.tsx`.
- [x] Migrate `app/page.tsx` (home page labels — empty state via `NoFixturesMessage`).
- [ ] Migrate `app/fixtures/page.tsx` and `app/fixtures/[id]/page.tsx`.
- [ ] Migrate `app/bracket/page.tsx`.
- [ ] Migrate `app/groups/page.tsx`.
- [ ] Migrate `app/mis-picks/page.tsx`.
- [x] Migrate `components/candidates.tsx`, `components/top-markets.tsx`,
      `components/accuracy-widget.tsx`.
- [x] Migrate `lib/content/markets-es.ts`: created `markets-en.ts` and
      `getMarketContent(locale)` helper in `lib/content/get-market-content.ts`.
- [x] Migrate `components/last-updated.tsx` (converted to Client Component).

## QA

- [ ] `pnpm tsc --noEmit` — no errors.
- [ ] `pnpm test` — no regressions.
- [ ] `pnpm build` — clean build.
- [ ] Manual: toggle EN, reload page, confirm language persists.
- [ ] Manual: clear localStorage, open app with browser set to `en-US`, confirm
      auto-detection sets EN.
- [ ] Manual: clear localStorage, open app with browser set to `es-CO`, confirm ES.
- [ ] Manual: all nav links render in both languages without layout breaks.
- [ ] Manual: market descriptions render in both languages on fixture detail page.

## Code Quality

- [ ] No hardcoded Spanish strings remain in component JSX.
- [ ] `NestedKeyOf` or equivalent enforces key parity at compile time.
- [ ] `LanguageProvider` is the only place that reads/writes `localStorage`.

## Reviewer

- [ ] `LanguageProvider` (Client) is the only i18n layer that touches runtime state.
- [ ] Server Components receive locale as a prop; they do not import Context.
- [ ] `lib/i18n/` has no imports from `lib/agents`, `lib/data`, or `lib/model`.
- [ ] Layer harness is not violated.

## Design

- [ ] `LanguageToggle` matches the terminal/broadcast visual style.
- [ ] No layout regressions on mobile or desktop after migration.
- [ ] Vercel preview reviewed by owner.

## Spec Closeout

- [ ] `specs/README.md` updated with phase-28 entry.
- [ ] `pnpm spec:check` passes.
- [ ] All acceptance criteria from `requirements.md` checked.
