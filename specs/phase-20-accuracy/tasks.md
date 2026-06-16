# phase-20-accuracy — Tasks

## Status

in_review

## Tasks

### Pre-implementación
- [x] 1. `spec-review`: validar que la spec está lista.
- [x] 2. Analyst: aprobar métrica de acierto (top-1 binario) y contrato de `AccuracyStats`.
- [x] 3. `data-contract`: formalizar `MatchAccuracyRecord`, `AccuracyStats` y el contrato de `computePredictionsRetroactive`.
- [x] 4. Design: aprobar wireframes de `ModelResultCard` y `AccuracyWidget`.
- [x] 5. Grill: detectar blockers antes de arrancar.

### Implementación
- [x] 6. Crear `lib/skills/accuracy.ts` con `deriveActualOutcome`, `topModelCall`, `resolveModelVerdict`, `computeAccuracyStats`.
- [x] 7. Escribir tests unitarios en Vitest para las skills de accuracy.
- [x] 8. Agregar `computePredictionsRetroactive` en `lib/agents/live-loader.ts` (sin guarda de finished).
- [x] 9. Crear `components/model-result-card.tsx`.
- [x] 10. Integrar `<ModelResultCard>` en `app/fixtures/[id]/page.tsx` para partidos finalizados.
- [x] 11. Crear `components/accuracy-widget.tsx`.
- [x] 12. Integrar `<AccuracyWidget>` en `app/page.tsx` (solo si `total >= 3`).

### Verificación
- [x] 13. `pnpm tsc --noEmit`.
- [x] 14. `pnpm test`.
- [x] 15. QA: verificar en fixture finalizado real que muestra predicciones + veredicto correcto.
- [x] 16. QA: verificar widget de home con porcentaje coherente.
- [x] 17. Code Quality sin bloqueantes. (bloqueantes corregidos: copy "apostó por" → "predijo"; "Empate ganó" → "Empate")
- [x] 18. Reviewer sin bloqueantes.
- [x] 19. Grill re-check.

### Cierre
- [x] 20. `spec-closeout`.
- [ ] 21. PR hacia `main`.

## Definition of Done

- [x] Fixture finalizado muestra predicción retroactiva + veredicto del modelo.
- [x] Home muestra widget de precisión cuando hay ≥ 3 partidos finalizados.
- [x] Skills de accuracy cubiertas por tests unitarios.
- [x] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [ ] `pnpm spec:check` pasa.
- [ ] `specs/README.md` actualizado.
- [ ] Preview de Vercel revisado por owner.
