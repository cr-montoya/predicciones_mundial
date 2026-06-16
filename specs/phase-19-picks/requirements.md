---
status: in_review
phase: 19
owner: cristian
branch: phase/19-picks
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: passed
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-19-picks — Requirements

## Status

in_review

## Objective

Permitir que cualquier visitante de la app haga picks de resultado (1X2) antes de
cada partido y vea si acertó o no una vez que el partido termine. El foco es la
experiencia personal de "apoyo mi criterio vs la IA" sin necesidad de cuenta ni
backend.

## Contexto

La app ya muestra predicciones de la IA (probabilidades de resultado, goleadores,
corners, etc.). El paso natural es que el usuario pueda contrastar su intuición con
la proyección: elegir el resultado antes del partido y ver el veredicto después.

Los datos necesarios ya están en el modelo: `Fixture.status` distingue `scheduled`,
`live` y `finished`; `homeGoals`/`awayGoals` dan el resultado final. No se necesita
backend nuevo.

## Decisión de storage

**localStorage** por las siguientes razones:

- Cero fricción: no requiere cuenta, auth ni servicio externo.
- Alineado con el framing de entretenimiento: el pick es personal al dispositivo.
- El stack Vercel + ISR no tiene runtime de DB; agregar uno solo para picks es
  sobredimensionado para MVP.
- Si en el futuro se quiere persistencia multi-device o leaderboard, el contrato de
  picks es migrable sin cambiar la UI ni la lógica de verificación.

## Scope

- Botón 1X2 en la vista de cada partido (`app/fixtures/[id]`) antes del inicio.
- Pick guardado en localStorage con clave `pick_<fixtureId>`.
- Pick bloqueado cuando `status === 'live' || status === 'finished'`.
- Veredicto (✓ Acertaste / ✗ Fallaste) visible cuando `status === 'finished'` y
  hay pick guardado.
- Badge de pick en las tarjetas de la lista de fixtures (`app/fixtures`) para
  identificar rápido en qué partidos ya se hizo pick.

## Out of Scope

- Picks de goleadores, marcador exacto u otros mercados (fase futura).
- Persistencia en base de datos o cuenta de usuario.
- Ranking o comparación entre usuarios.
- Notificaciones push de resultado.

## Modelo de datos (localStorage)

```ts
// Clave: `pick_${fixtureId}`  — string
type PickOutcome = 'home' | 'draw' | 'away'

interface StoredPick {
  fixtureId: number
  outcome: PickOutcome
  pickedAt: string  // ISO 8601
}
```

### Resolución del veredicto

```ts
function resolveVerdict(
  pick: PickOutcome,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' {
  const actual: PickOutcome =
    homeGoals > awayGoals ? 'home' :
    awayGoals > homeGoals ? 'away' :
    'draw'
  return pick === actual ? 'correct' : 'incorrect'
}
```

Esta lógica va en `lib/skills/picks.ts` como función pura.

## Requirements

1. En la vista de detalle de fixture, el usuario puede elegir home / empate / away
   antes de que el partido comience.
2. El pick queda bloqueado (no editable) en cuanto el partido pasa a `live` o
   `finished`.
3. Al terminar el partido, se muestra un veredicto claro: acertó o falló.
4. La elección persiste entre recargas del mismo dispositivo (localStorage).
5. En la lista de fixtures, cada tarjeta muestra un indicador de si ya hay pick.
6. No se requiere login para hacer un pick.

## Acceptance Criteria

- [ ] Partido scheduled: botones 1X2 activos, pick se guarda y persiste al recargar.
- [ ] Partido live: botones deshabilitados, pick guardado se muestra en estado
      bloqueado.
- [ ] Partido finished + pick correcto: veredicto ✓ visible con el score final.
- [ ] Partido finished + pick incorrecto: veredicto ✗ visible con el score final.
- [ ] Partido finished sin pick: no se muestra sección de picks.
- [ ] Lista de fixtures: tarjeta con pick muestra badge diferenciador.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm test` pasa (skill `resolveVerdict` cubierta por tests unitarios).

## Risks and Assumptions

- localStorage puede ser borrado por el usuario o el navegador. El diseño asume que
  eso es aceptable en un contexto de entretenimiento.
- El pick se basa en la hora de kickoff del servidor; si el usuario tiene el horario
  del dispositivo desfasado, el lock puede no coincidir exactamente. Aceptable para
  MVP — la fuente de verdad es `fixture.status` del API, no el reloj del cliente.
- Los picks son Client Components (necesitan acceso a localStorage), pero el resto
  de la página de fixture sigue siendo Server Component. El bloque de picks se
  aisla como componente cliente pequeño que recibe el fixture como prop.
