# Requirements: Phase 0 - Setup

## Status

Completed.

## Objective

Create the technical foundation of the project with Next.js, TypeScript, Tailwind, a layered architecture, and testing tools.

## Requirements

1. The app must use Next.js App Router with TypeScript.
2. A base directory structure must exist: `app/`, `lib/data/`, `lib/model/`, `lib/db/`, and `scripts/`.
3. Local SQLite support must exist with the DB gitignored.
4. Style configuration with Tailwind must exist.
5. Test tooling with Vitest must exist.
6. An environment variable template for API keys must exist.

## Success Criteria

1. `pnpm dev` starts the app locally.
2. `pnpm test` runs Vitest.
3. The structure allows separating UI, agents, models, and skills.
