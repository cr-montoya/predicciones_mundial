# Tasks: Fase 16 — Goleadores y mercados extendidos

## 1. Analyst

- [ ] Definir contrato de team totals.
- [ ] Definir contrato de combinados simples.
- [ ] Definir contrato mínimo de goleadores.
- [ ] Definir umbrales de confidence.
- [ ] Confirmar qué mercados se muestran en MVP.

## 2. Design

- [ ] Definir jerarquía visual del fixture detail enriquecido.
- [ ] Definir patrón para secciones plegables.
- [ ] Definir UI para confianza baja/no disponible.
- [ ] Validar mobile y modo captura.

## 3. Developer

- [ ] Crear rama desde `main`: `phase/16-scorers-extended-markets`.
- [ ] Agregar skills puras para team totals.
- [ ] Agregar skills puras para combinados.
- [ ] Extender `computeMatchOutputs` con nuevos mercados.
- [ ] Agregar modelo/skill de goleadores si hay dataset disponible.
- [ ] Crear fallback de "goleadores no disponibles" si no hay datos.
- [ ] Actualizar fixture detail.
- [ ] Conectar copy de mercados desde `markets-es.ts`.
- [ ] Mantener cálculos en server/runtime ISR.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Tests de team totals.
- [ ] Tests de combinados.
- [ ] Tests de goleadores con datos completos.
- [ ] Tests de goleadores sin datos.
- [ ] Fixture detail renderiza con partido scheduled.
- [ ] Fixture detail renderiza con partido finished.

## 5. Reviewer

- [ ] Skills sin imports de DB/API/fetch.
- [ ] Models sin llamadas externas.
- [ ] Client components sin imports de model/provider.
- [ ] `modelVersion` actualizado si cambia contrato.
- [ ] No hay saturación de mercados en UI.

## 6. Security

- [ ] API keys solo server-side.
- [ ] No hay logs de payloads sensibles.
- [ ] No se agregan endpoints públicos innecesarios.
- [ ] Rate limit/API quota considerada.

## 7. Owner review

- [ ] Revisar preview de Vercel.
- [ ] Validar claridad de mercados nuevos.
- [ ] Validar que goleadores no prometen precisión falsa.
- [ ] Aprobar PR antes de merge.
