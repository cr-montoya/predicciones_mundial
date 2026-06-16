# phase-20-accuracy — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`: validar que la spec está lista.
- [ ] 2. Analyst: aprobar métrica de acierto (top-1 binario) y contrato de `AccuracyStats`.
- [ ] 3. `data-contract`: formalizar `MatchAccuracyRecord`, `AccuracyStats` y el contrato de `computePredictionsRetroactive`.
- [ ] 4. Design: aprobar wireframes de `ModelResultCard` y `AccuracyWidget`.
- [ ] 5. Grill: detectar blockers antes de arrancar.

### Implementación
- [ ] 6. Crear `lib/skills/accuracy.ts` con `deriveActualOutcome`, `topModelCall`, `resolveModelVerdict`, `computeAccuracyStats`.
- [ ] 7. Escribir tests unitarios en Vitest para las skills de accuracy.
- [ ] 8. Agregar `computePredictionsRetroactive` en `lib/agents/live-loader.ts` (sin guarda de finished).
- [ ] 9. Crear `components/model-result-card.tsx`.
- [ ] 10. Integrar `<ModelResultCard>` en `app/fixtures/[id]/page.tsx` para partidos finalizados.
- [ ] 11. Crear `components/accuracy-widget.tsx`.
- [ ] 12. Integrar `<AccuracyWidget>` en `app/page.tsx` (solo si `total >= 3`).

### Verificación
- [ ] 13. `pnpm tsc --noEmit`.
- [ ] 14. `pnpm test`.
- [ ] 15. QA: verificar en fixture finalizado real que muestra predicciones + veredicto correcto.
- [ ] 16. QA: verificar widget de home con porcentaje coherente.
- [ ] 17. Code Quality sin bloqueantes.
- [ ] 18. Reviewer sin bloqueantes.
- [ ] 19. Grill re-check.

### Cierre
- [ ] 20. `spec-closeout`.
- [ ] 21. PR hacia `main`.

## Definition of Done

- [ ] Fixture finalizado muestra predicción retroactiva + veredicto del modelo.
- [ ] Home muestra widget de precisión cuando hay ≥ 3 partidos finalizados.
- [ ] Skills de accuracy cubiertas por tests unitarios.
- [ ] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [ ] `pnpm spec:check` pasa.
- [ ] `specs/README.md` actualizado.
- [ ] Preview de Vercel revisado por owner.
