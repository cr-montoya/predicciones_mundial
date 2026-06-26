# fix-better-sqlite3-devdep — Tasks

## Status

completed

## Tasks

- [x] 1. Verify that no runtime file imports `better-sqlite3` directly.
- [x] 2. Move `better-sqlite3` and `@types/better-sqlite3` to `devDependencies` in `package.json`. (was already there, no change required)
- [x] 3. Run `pnpm install` to update the lockfile. (lockfile already consistent)
- [x] 4. Run `pnpm tsc --noEmit`, `pnpm test`, `pnpm build`.
- [x] 5. Add `better-sqlite3` to `serverExternalPackages` in `next.config.ts` (preventive action).

## Definition of Done

- [x] `pnpm tsc --noEmit`, `pnpm test`, and `pnpm build` pass.
- [x] `pnpm spec:check` passes (no errors).
- [x] `specs/README.md` updated.
- [x] DEP0176 warning no longer appears in Vercel preview log.
