# phase-25-match-context — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`.
- [ ] 2. Analyst: validar que mostrar contexto H2H no implica cambio en el modelo.
- [ ] 3. `data-contract`: formalizar `H2HMatch` y endpoint de football-data.org a usar.
- [ ] 4. Design: aprobar diseño de forma y H2H.
- [ ] 5. Grill: verificar disponibilidad del endpoint H2H en el plan actual de la API.

### Implementación
- [ ] 6. Crear `lib/agents/h2h-loader.ts` con timeout y fallback vacío.
- [ ] 7. Crear `components/form-strip.tsx`.
- [ ] 8. Crear `components/match-context.tsx`.
- [ ] 9. Integrar `<MatchContext>` en `app/fixtures/[id]/page.tsx`.

### Verificación
- [ ] 10. `pnpm tsc --noEmit`.
- [ ] 11. QA: fixture donde ambos equipos ya jugaron → forma visible.
- [ ] 12. QA: fixture primer partido de ambos equipos → sección CONTEXTO oculta.
- [ ] 13. QA: simular fallo del API H2H → sin error visible.
- [ ] 14. Code Quality y Reviewer.

### Cierre
- [ ] 15. `spec-closeout` y PR.

## Definition of Done

- [ ] Forma reciente visible cuando hay partidos jugados.
- [ ] H2H visible si hay datos; omitido silenciosamente si falla.
- [ ] Sin degradación de performance (timeout H2H ≤ 2s).
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] Preview de Vercel revisado.
