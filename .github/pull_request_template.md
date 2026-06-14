# PR

## Tipo

- [ ] Phase: `phase/<numero>-<descripcion>`
- [ ] Fix: `fix/<descripcion>`
- [ ] Docs/config

## Resumen

<!-- Que cambia este PR y por que. Si es una fase, enlaza o menciona la fase del plan. -->

## Alcance

- 

## Fuera de alcance

<!-- Que decidimos NO tocar en este PR para mantenerlo chico. -->

- 

## Preview / revision funcional

- Cloudflare preview:
- Rutas revisadas:
  - [ ] `/`
  - [ ] `/fixtures`
  - [ ] `/fixtures/[id]`
  - [ ] `/groups`
- Mobile revisado:
  - [ ] Si aplica
  - [ ] No aplica

## Agentes y gates

- [ ] Analyst aprobado o no aplica
- [ ] Design aprobado o no aplica
- [ ] QA aprobado
- [ ] Reviewer sin bloqueantes
- [ ] Security sin criticos
- [ ] Owner review pendiente antes de merge

## Verificacion local

- [ ] `pnpm tsc --noEmit`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Otro:

## UI / copy

- [ ] Incluye cambios visuales o de copy
- [ ] No incluye cambios visuales o de copy

Screenshots o notas visuales:

<!-- Pegar screenshots, links o descripcion breve. Obligatorio si toca UI. -->

## Datos precomputados

- [ ] Cambia `lib/data/*.json`
- [ ] No cambia datos precomputados

Scripts ejecutados si cambiaron datos:

- [ ] `pnpm refresh-fixtures`
- [ ] `pnpm precompute`
- [ ] Otro:

Notas sobre cambios de probabilidades/fixtures:

<!-- Explica cambios relevantes en JSON o predicciones. -->

## Riesgos y rollback

Riesgos:

- 

Rollback:

- [ ] Revertir este PR
- [ ] Rollback en Cloudflare Pages
- [ ] Otro:

## Checklist antes de merge

- [ ] Rama sale de `main` actualizado
- [ ] PR apunta a `main`
- [ ] Scope pequeno y revisable
- [ ] No hay secretos ni credenciales en el diff
- [ ] `main` sigue desplegable despues del merge
- [ ] Aprobacion humana del owner recibida
