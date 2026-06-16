---
status: pending
phase:
owner: cristian
branch:
pr:
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: not_applicable
  data_contract: not_applicable
  security: not_applicable
  qa: pending
  code_quality: not_applicable
  reviewer: pending
---

# fix-better-sqlite3-devdep — Requirements

## Status

pending

## Objective

Eliminar el warning de deprecación que emite `better-sqlite3` durante el build de Vercel
moviendo el paquete a `devDependencies`, donde pertenece según la política de CLAUDE.md.

## Contexto

Durante el build de Vercel aparece:

```
[DEP0176] DeprecationWarning: fs.R_OK is deprecated, use fs.constants.R_OK instead
```

Este warning proviene del script de postinstall de `better-sqlite3`, que se ejecuta porque
el paquete está en `dependencies` y Vercel lo instala. Según CLAUDE.md, `better-sqlite3`
queda exclusivamente para scripts locales y no debe entrar al runtime de Vercel.

## Scope

- Mover `better-sqlite3` y `@types/better-sqlite3` de `dependencies` a `devDependencies` en `package.json`.
- Verificar que ningún archivo del runtime de Next.js importa `better-sqlite3` directamente.

## Out of Scope

- Cambiar la versión de `better-sqlite3`.
- Eliminar `better-sqlite3` del proyecto.
- Modificar los scripts locales que usan `better-sqlite3`.

## Requirements

1. `better-sqlite3` y `@types/better-sqlite3` deben estar en `devDependencies`.
2. El runtime de Vercel (Next.js App Router) no debe importar `better-sqlite3`.
3. Los scripts locales que usan `better-sqlite3` deben seguir funcionando.
4. `pnpm build` debe pasar sin el warning de DEP0176.

## Acceptance Criteria

- [ ] `better-sqlite3` aparece en `devDependencies` en `package.json`.
- [ ] `grep -r "better-sqlite3" app/ components/ lib/agents/ lib/model/ lib/skills/` retorna vacío.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm test` pasa.
- [ ] `pnpm build` pasa sin el warning DEP0176 (verificar en log de preview de Vercel).

## Risks and Assumptions

- Si algún archivo del runtime importa `better-sqlite3`, el build de Vercel fallará tras el cambio. El grep previo al commit es el guard.
- Vercel instala `devDependencies` durante el build por defecto. Si el warning persiste, el fix definitivo es agregar `better-sqlite3` a `serverExternalPackages` en `next.config.ts`.
