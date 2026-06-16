---
status: blocked
phase: 22
owner: cristian
branch: phase/22-mis-picks
pr:
preview:
gates:
  spec_review: pending
  grill: pending
  analyst: not_applicable
  design: pending
  data_contract: pending
  security: not_applicable
  qa: pending
  code_quality: pending
  reviewer: pending
---

# phase-22-mis-picks — Requirements

## Status

blocked — depende de phase-19 (picks en localStorage)

## Objective

Página `/mis-picks` donde el usuario ve un resumen de todos sus picks: pendientes,
acertados y fallados, con su contador personal de aciertos. Cierra el loop de la
feature de picks (phase-19) dando al usuario un lugar donde ver su historial completo.

## Contexto

Phase-19 agrega picks 1X2 guardados en localStorage. Una vez hecho el pick en la
página de cada partido, el usuario no tiene forma de ver todos sus picks juntos ni
saber su récord personal. `/mis-picks` resuelve eso.

**Depende de phase-19** (picks en localStorage deben estar implementados antes).

## Scope

- Ruta `/mis-picks` (Client Component que lee localStorage al montar).
- Tres secciones: picks pendientes (partido no empezado), en curso (live), resueltos
  (finished con veredicto).
- Contador personal: X acertados / Y resueltos (Z%).
- Cada pick muestra: equipos, mi elección, resultado real si disponible, veredicto.
- Link desde la home o el nav.
- Estado vacío si no hay ningún pick guardado.

## Out of Scope

- Persistencia en base de datos o sync entre dispositivos.
- Leaderboard o comparación con otros usuarios.
- Picks de otros mercados (goleadores, goles). Solo resultado 1X2.
- Exportar o compartir el historial completo (puede ser fase 23 para cards individuales).

## Requirements

1. La ruta `/mis-picks` es accesible y carga los picks desde localStorage.
2. Los picks se muestran agrupados: pendientes / en curso / resueltos.
3. El contador personal de aciertos es visible y correcto.
4. Cada pick resuelto muestra veredicto ✓/✗ y el resultado real del partido.
5. Si no hay picks, se muestra un estado vacío con CTA a ver fixtures.
6. La página es Client Component (necesita localStorage); el layout general es
   Server Component.

## Acceptance Criteria

- [ ] `/mis-picks` renderiza sin errores con y sin picks en localStorage.
- [ ] Estado vacío muestra CTA a `/fixtures`.
- [ ] Picks pendientes y en curso se listan correctamente.
- [ ] Picks resueltos muestran veredicto y resultado real.
- [ ] Contador personal de aciertos es correcto.
- [ ] `pnpm tsc --noEmit` pasa.

## Risks and Assumptions

- **Depende de phase-19**: sin picks en localStorage, la página muestra estado
  vacío. Se puede implementar después de phase-19 o en paralelo con estado vacío
  como MVP.
- localStorage puede estar vacío en SSR; el componente debe usar `useEffect` o
  `'use client'` con hidratación segura para evitar mismatch.
- Los datos del fixture (equipos, scores) deben cargarse desde el servidor para
  enriquecer cada pick. Se puede resolver con una llamada al API de fixtures desde
  el client o pasando los datos como props desde un Server Component padre.
