# i18n — Design

## Architecture

No changes to the App Router folder structure. The approach uses a React Context
to distribute locale state without converting `app/` to `app/[locale]/`.

```
lib/i18n/
  en.ts          — English translation dictionary
  es.ts          — Spanish translation dictionary (source of truth for current copy)
  types.ts       — Translations interface, derived from en.ts
  context.tsx    — LanguageProvider (Client Component)
  hook.ts        — useTranslation() hook

components/
  language-toggle.tsx   — EN / ES switcher (Client Component)
```

## Translation Dictionary Shape

```ts
// lib/i18n/types.ts
import type en from './en'
export type Translations = typeof en
export type Locale = 'en' | 'es'
```

```ts
// lib/i18n/en.ts
const en = {
  nav: {
    home: 'Home',
    fixtures: 'Fixtures',
    bracket: 'Bracket',
    groups: 'Groups',
    myPicks: 'My Picks',
  },
  hero: {
    title: 'World Cup 2026 Prediction Simulator',
    subtitle: 'AI-assisted statistical football analytics',
  },
  // ... all other keys
} as const
export default en
```

## LanguageProvider

Client Component placed in `app/layout.tsx`. On mount it reads `localStorage`
for the saved locale, falls back to browser language detection, and falls back
to `'es'`. It exposes `{ locale, setLocale }` via Context.

## useTranslation Hook

```ts
// lib/i18n/hook.ts
export function useTranslation() {
  const { locale } = useLanguage()
  const dict = locale === 'en' ? en : es
  const t = (key: NestedKeyOf<Translations>) => resolve(dict, key)
  return { t, locale }
}
```

A `NestedKeyOf` utility type enforces key correctness at compile time.

## LanguageToggle Component

Minimal pill in the nav bar:

```
[ EN | ES ]
```

Active locale is highlighted. Clicking the inactive option calls `setLocale`,
which also updates `localStorage`.

## Server Components Strategy

**Implemented approach (deviation from original design):**

The original design proposed threading `locale` as a prop from a Client Component
boundary. In practice, Server Component pages (e.g. `app/fixtures/page.tsx`) are
the root of their render tree and have no Client Component ancestor to receive a
prop from.

The implemented approach uses a cookie:

1. `LanguageProvider` sets `document.cookie = 'wc2026-locale=<locale>'` on every
   locale change (client-side).
2. `lib/i18n/server.ts` exports `getServerTranslations()`, which reads the cookie
   via `cookies()` from `next/headers` and returns `{ t, locale }`.
3. Server Components call `getServerTranslations()` directly:

```ts
// In a Server Component page
import { getServerTranslations } from '@/lib/i18n/server'

export default async function Page() {
  const { t, locale } = await getServerTranslations()
  // use t and locale directly
}
```

**Trade-off:** Using `cookies()` forces Next.js to treat the route as Dynamic (`ƒ`)
instead of Static (`○`). Routes that previously used ISR (`revalidate = 3600`) and
now call `getServerTranslations()` lose ISR. Currently affected: `app/fixtures/page.tsx`.
Routes that keep all translation in Client Components retain ISR (e.g. `/`, `/bracket`,
`/groups`, `/mis-picks`).

`lib/i18n/server.ts` is guarded with `import 'server-only'` to prevent accidental
Client Component imports.

## markets-es.ts Migration

`lib/content/markets-es.ts` currently holds all market copy as a monolithic
Spanish dictionary. In this phase:

1. It is kept as-is and re-exported as the Spanish source.
2. An `lib/content/markets-en.ts` file is created with the English translations.
3. A `getMarketContent(locale)` helper returns the correct dictionary.
4. Components using `markets-es.ts` directly are updated to call `getMarketContent`.

## UI Placement

The `LanguageToggle` sits in the right side of the nav bar, after the main nav links.
Design follows the existing terminal/broadcast aesthetic: monospace font, subtle border,
no heavy decorations.

## Incremental Migration Plan

1. Set up `lib/i18n/` infrastructure and `LanguageProvider` in layout.
2. Add `LanguageToggle` to nav — visible but toggle has no effect yet.
3. Migrate nav strings.
4. Migrate home page (hero, disclaimer, market sections).
5. Migrate fixture detail page.
6. Migrate bracket, groups, my-picks pages.
7. Migrate `markets-es.ts` copy.
8. Remove all remaining hardcoded Spanish strings from JSX.

## Risks

- Server Components need locale prop threaded from the layout Client Component
  boundary — this requires careful prop-drilling or a shared server/client boundary.
- `markets-es.ts` is used in many places; the migration must be done atomically
  per file to avoid type errors mid-migration.
