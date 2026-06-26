# fix-better-sqlite3-devdep — Design

## Context

`better-sqlite3` is a native dependency (requires compilation with `node-gyp`) that is only
used in local scripts (`scripts/*.ts`). It is in `dependencies`, which causes Vercel to
install it and run its postinstall, emitting a Node.js deprecation warning.

According to CLAUDE.md: "SQLite/better-sqlite3 is for local scripts and project history;
it must not enter Vercel's runtime."

## Architecture

- **Config/Build**: change in `package.json` only.
- No layer of the harness (Skills, Models, Agents, UI) is touched.

## Required Change

In `package.json`, move from `dependencies` → `devDependencies`:

```json
"better-sqlite3": "^12.10.0",
"@types/better-sqlite3": "^7.6.13"
```

## Pre-commit Verification

```bash
grep -r "better-sqlite3" app/ components/ lib/agents/ lib/model/ lib/skills/ lib/data/
```

Must return empty. If there are imports, resolve them before moving.

## Alternative If Warning Persists in Vercel

Add to `next.config.ts`:

```ts
serverExternalPackages: ['better-sqlite3']
```

This excludes the package from the bundle even if installed.

## Testing Strategy

- `pnpm tsc --noEmit` — local scripts continue to type correctly
- `pnpm test` — tests do not depend on `better-sqlite3`
- `pnpm build` — Next.js build passes without the package in `dependencies`
- Verify in Vercel preview log that the warning disappears
