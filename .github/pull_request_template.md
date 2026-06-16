# PR

## Tipo

- [ ] Phase: `phase/<numero>-<descripcion>`
- [ ] Fix: `fix/<descripcion>`
- [ ] Docs/config

## Spec

- Spec:
- Fase:
- Estado de la spec:
  - [ ] pending
  - [ ] active
  - [ ] blocked
  - [ ] in_review
  - [ ] completed
  - [ ] deferred
  - [ ] historical / no aplica
- [ ] Metadata de la spec actualizada o no aplica
- [ ] `specs/README.md` actualizado o no aplica

## SDD

- [ ] Gates aplicables revisados según matriz de `CLAUDE.md`
- [ ] `pnpm spec:check` ejecutado
- [ ] ADR enlazado o no aplica
- [ ] Desviaciones de la spec documentadas o no aplica

## Resumen

<!-- Que cambia este PR y por que. Si es una fase, enlaza la spec y menciona el objetivo. -->

## Alcance

- 

## Fuera de alcance

<!-- Que decidimos NO tocar en este PR para mantenerlo chico. -->

- 

## Acceptance criteria

<!-- Copiar o resumir criterios desde specs/<fase>/requirements.md. -->

- [ ] 
- [ ] 
- [ ] 

## Preview / revision funcional

- Vercel preview:
- Rutas revisadas:
  - [ ] `/`
  - [ ] `/fixtures`
  - [ ] `/fixtures/[id]`
  - [ ] `/groups`
  - [ ] Otra:
- Mobile revisado:
  - [ ] Si aplica
  - [ ] No aplica

## Agentes y gates

- [ ] Grill inicial ejecutado o no aplica
- [ ] Grill re-check ejecutado antes del PR o no aplica
- [ ] Commit skill usada para commits o no aplica
- [ ] Analyst aprobado o no aplica
- [ ] Design aprobado o no aplica
- [ ] QA aprobado
- [ ] Code Quality sin bloqueantes
- [ ] Reviewer sin bloqueantes
- [ ] Security sin criticos
- [ ] Owner review pendiente antes de merge

## Verificacion local

- [ ] `pnpm tsc --noEmit`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm spec:check`
- [ ] Otro:

## Harness / arquitectura

- [ ] Skills sin I/O, DB, env vars ni fetch
- [ ] Models sin I/O externo ni DB
- [ ] Agents concentran providers, env vars server-side y cache
- [ ] Client Components no importan `lib/model`, `lib/db`, providers ni env vars
- [ ] No aplica

## UI / copy

- [ ] Incluye cambios visuales o de copy
- [ ] No incluye cambios visuales o de copy

Screenshots o notas visuales:

<!-- Pegar screenshots, links o descripcion breve. Obligatorio si toca UI. -->

## Datos / APIs / ISR

- [ ] Cambia `lib/data/*.json`
- [ ] Cambia runtime server / ISR / `revalidate`
- [ ] Agrega o modifica provider/API externa
- [ ] No cambia datos ni runtime

Scripts ejecutados si cambiaron datos:

- [ ] `pnpm refresh-fixtures`
- [ ] `pnpm precompute`
- [ ] Otro:

Notas sobre cambios de probabilidades/fixtures/cache:

<!-- Explica cambios relevantes en JSON, predicciones, cache o API quota. -->

## Seguridad

- [ ] No hay secretos ni credenciales en el diff
- [ ] No se agregan variables `NEXT_PUBLIC_` para secrets
- [ ] API keys quedan server-side
- [ ] CSP / headers revisados si aplica
- [ ] Cuotas/rate limits considerados si hay API externa

## Riesgos y rollback

Riesgos:

- 

Rollback:

- [ ] Revertir este PR
- [ ] Rollback en Vercel
- [ ] Otro:

## Checklist antes de merge

- [ ] Rama sale de `main` actualizado
- [ ] PR apunta a `main`
- [ ] Commits siguen Conventional Commits (`type(scope): description`)
- [ ] Scope pequeno y revisable
- [ ] Template completo, con no-aplica marcado explicitamente
- [ ] `main` sigue desplegable despues del merge
- [ ] Aprobacion humana del owner recibida
