# fix-better-sqlite3-devdep — Tasks

## Status

pending

## Tasks

- [ ] 1. Verificar que ningún archivo del runtime importa `better-sqlite3` directamente.
- [ ] 2. Mover `better-sqlite3` y `@types/better-sqlite3` a `devDependencies` en `package.json`.
- [ ] 3. Correr `pnpm install` para actualizar el lockfile.
- [ ] 4. Correr `pnpm tsc --noEmit`, `pnpm test`, `pnpm build`.
- [ ] 5. Si el warning persiste en Vercel, agregar `better-sqlite3` a `serverExternalPackages` en `next.config.ts`.

## Definition of Done

- [ ] `pnpm tsc --noEmit`, `pnpm test` y `pnpm build` pasan.
- [ ] `pnpm spec:check` passes.
- [ ] `specs/README.md` actualizado.
- [ ] Warning DEP0176 no aparece en log del preview de Vercel.
