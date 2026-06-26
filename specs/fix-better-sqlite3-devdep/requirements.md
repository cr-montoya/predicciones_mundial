---
status: completed
phase:
owner: cristian
branch: fix/better-sqlite3-devdep
pr: "9"
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: not_applicable
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: not_applicable
  reviewer: passed
---

# fix-better-sqlite3-devdep — Requirements

## Status

completed

## Objective

Eliminate the deprecation warning emitted by `better-sqlite3` during the Vercel build
by moving the package to `devDependencies`, where it belongs according to the CLAUDE.md policy.

## Context

During the Vercel build the following appears:

```
[DEP0176] DeprecationWarning: fs.R_OK is deprecated, use fs.constants.R_OK instead
```

This warning comes from the postinstall script of `better-sqlite3`, which runs because
the package is in `dependencies` and Vercel installs it. According to CLAUDE.md,
`better-sqlite3` is exclusively for local scripts and must not enter Vercel's runtime.

## Scope

- Move `better-sqlite3` and `@types/better-sqlite3` from `dependencies` to `devDependencies` in `package.json`.
- Verify that no Next.js runtime file directly imports `better-sqlite3`.

## Out of Scope

- Changing the version of `better-sqlite3`.
- Removing `better-sqlite3` from the project.
- Modifying local scripts that use `better-sqlite3`.

## Requirements

1. `better-sqlite3` and `@types/better-sqlite3` must be in `devDependencies`.
2. The Vercel runtime (Next.js App Router) must not import `better-sqlite3`.
3. Local scripts that use `better-sqlite3` must continue to work.
4. `pnpm build` must pass without the DEP0176 warning.

## Acceptance Criteria

- [ ] `better-sqlite3` appears in `devDependencies` in `package.json`.
- [ ] `grep -r "better-sqlite3" app/ components/ lib/agents/ lib/model/ lib/skills/` returns empty.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes without the DEP0176 warning (verify in Vercel preview log).

## Risks and Assumptions

- If any runtime file imports `better-sqlite3`, the Vercel build will fail after the change. The grep before commit is the guard.
- Vercel installs `devDependencies` during the build by default. If the warning persists, the definitive fix is adding `better-sqlite3` to `serverExternalPackages` in `next.config.ts`.
