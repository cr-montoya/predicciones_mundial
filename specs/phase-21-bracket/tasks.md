# phase-21-bracket — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`.
- [ ] 2. Analyst: validar uso de `ROUND_INTENSITY` para probabilidades en eliminatorias.
- [ ] 3. `data-contract`: confirmar formato de `round` strings del API y normalización.
- [ ] 4. Design: aprobar layout de bracket en móvil y desktop.
- [ ] 5. Grill.

### Implementación
- [ ] 6. Crear `app/bracket/page.tsx` con carga de fixtures de eliminatorias.
- [ ] 7. Crear `components/bracket-matchup.tsx`.
- [ ] 8. Crear `components/bracket-view.tsx` con layout por ronda.
- [ ] 9. Agregar link "BRACKET" al nav en `app/layout.tsx`.

### Verificación
- [ ] 10. `pnpm tsc --noEmit` y `pnpm build`.
- [ ] 11. QA: verificar slots vacíos, partidos jugados y pendientes.
- [ ] 12. Code Quality y Reviewer.
- [ ] 13. Grill re-check.

### Cierre
- [ ] 14. `spec-closeout` y PR.

## Definition of Done

- [ ] `/bracket` renderiza sin errores.
- [ ] Cruces con resultado real los muestran; pendientes muestran probabilidades.
- [ ] Slots vacíos con "Por definir".
- [ ] Nav actualizado.
- [ ] `pnpm build` pasa.
- [ ] Preview de Vercel revisado.
