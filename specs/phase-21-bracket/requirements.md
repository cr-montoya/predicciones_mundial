---
status: pending
phase: 21
owner: cristian
branch: phase/21-bracket
pr:
preview:
gates:
  spec_review: pending
  grill: pending
  analyst: pending
  design: pending
  data_contract: pending
  security: not_applicable
  qa: pending
  code_quality: pending
  reviewer: pending
---

# phase-21-bracket — Requirements

## Status

pending

## Objective

Mostrar el cuadro de eliminatorias del Mundial 2026 con las probabilidades del
modelo para cada cruce posible, actualizado conforme avanza el torneo. Es el
contenido más viral del torneo: permite ver "qué camino proyecta la IA hacia la
final".

## Contexto

El Mundial 2026 tiene 48 equipos en 12 grupos de 4. La fase de grupos produce
32 clasificados (top 2 de cada grupo + 8 mejores terceros) que pasan a la Ronda
de 32. Los cruces de eliminatorias ya están disponibles en football-data.org con
`round: 'round_of_32'`, `'round_of_16'`, `'quarter_final'`, `'semi_final'`,
`'final'`. El modelo ya tiene constantes de intensidad por ronda en
`lib/model/constants.ts`.

Cuando los cruces aún no están definidos (porque la fase de grupos no terminó),
se muestra el bracket con los clasificados ya conocidos y slots vacíos para los
pendientes.

## Scope

- Ruta `/bracket` con el cuadro completo de eliminatorias.
- Cada cruce muestra: equipos (con banderas), probabilidad de avance para cada uno
  según el modelo, y resultado real si el partido ya se jugó.
- Slots vacíos con "Por definir" mientras los clasificados no están confirmados.
- Link desde la home y desde el nav.
- Server Component con ISR (revalidate 3600).

## Out of Scope

- Simulador interactivo donde el usuario predice su propio bracket (fase futura).
- Probabilidades acumuladas de llegar a la final o campeón (eso ya está en la home
  en `Candidates`).
- Línea de tiempo o historia de cómo evolucionaron las probabilidades.

## Requirements

1. La ruta `/bracket` es accesible y renderiza el cuadro de eliminatorias.
2. Cada cruce de una ronda definida muestra los dos equipos con su bandera y la
   probabilidad de avance del modelo (`result_1x2` ajustado por `ROUND_INTENSITY`).
3. Si el partido ya se jugó, muestra el resultado real y marca al ganador.
4. Si un clasificado aún no está confirmado, el slot muestra "Por definir".
5. El layout es legible en móvil (una columna por ronda, scroll horizontal o
   vista colapsada).
6. Link de navegación a `/bracket` en el nav global.

## Acceptance Criteria

- [ ] `/bracket` renderiza sin errores con datos reales del torneo.
- [ ] Partidos de eliminatorias disputados muestran resultado real.
- [ ] Partidos pendientes muestran probabilidades del modelo.
- [ ] Slots sin clasificado muestran "Por definir".
- [ ] Legible en móvil.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm build` pasa.

## Risks and Assumptions

- football-data.org puede no devolver los cruces de eliminatorias hasta que los
  grupos terminen. El diseño debe manejar el caso de `fixtures` de eliminatorias
  vacíos o slots vacíos sin romper.
- El layout de bracket en móvil es un problema de UX conocido; la solución MVP
  es scroll horizontal o colapsar por ronda.
- Los `round` strings del API (`ROUND OF 32`, etc.) pueden necesitar normalización
  al formato interno (`round_of_32`).
