# fix-better-sqlite3-devdep — Tasks

## Status

completed

## Tasks

- [x] 1. Verificar que ningún archivo del runtime importa `better-sqlite3` directamente.
- [x] 2. Mover `better-sqlite3` y `@types/better-sqlite3` a `devDependencies` en `package.json`. (ya estaba, no requirió cambio)
- [x] 3. Correr `pnpm install` para actualizar el lockfile. (lockfile ya consistente)
- [x] 4. Correr `pnpm tsc --noEmit`, `pnpm test`, `pnpm build`.
- [x] 5. Agregar `better-sqlite3` a `serverExternalPackages` en `next.config.ts` (acción preventiva).

## Definition of Done

- [x] `pnpm tsc --noEmit`, `pnpm test` y `pnpm build` pasan.
- [x] `pnpm spec:check` pasa (sin errores).
- [x] `specs/README.md` actualizado.
- [x] Warning DEP0176 no aparece en log del preview de Vercel.
