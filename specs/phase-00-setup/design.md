# Design: Phase 0 - Setup

## Base Architecture

```
app/       -> Next.js routes
components/ -> reusable UI
lib/data/ -> providers and normalization
lib/model/ -> statistical models
lib/db/    -> schema, client, and local writes
scripts/   -> local tasks
```

## Decisions

- Next.js App Router as the main framework.
- Strict TypeScript for contracts between layers.
- Tailwind for fast and consistent design.
- Vitest for unit tests of skills/models.
- Local SQLite for initial development.

## Risks

- Coupling UI with DB/models too early.
- Mixing secrets into committed files.
- Creating structure without tests from the start.
