# Design: Fase 18 - Datos de jugadores enriquecidos

## Enfoque

Mantener el modelo de goleadores como funcion pura que recibe datos de jugadores ya
normalizados. Los agents se encargan de traer lineups/lesiones y convertirlos a inputs.

## Arquitectura propuesta

```
API-Football lineups/injuries
   -> lib/agents/lineups-loader.ts
   -> normalizacion por fixtureId
   -> cache JSON/server
   -> lib/model/scorers.ts
   -> UI goleadores
```

## Agent de lineups

`lib/agents/lineups-loader.ts`:

- Recibe `fixtureId` y kickoff.
- Solo consulta si el partido esta a menos de 2 horas o ya empezo.
- Retorna `null` si no hay lineup.
- Retorna titulares/suplentes si hay lineup.
- Adjunta timestamp de fuente.

## Injuries

Si el endpoint de injuries esta disponible:

- `out`: `starterProbability = 0`.
- `doubtful`: `starterProbability = 0.2`.
- `suspended`: `starterProbability = 0`.

Analyst puede ajustar valores.

## Contrato de scorer actualizado

```ts
interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  expectedMinutes: number
  goalsPer90: number
  penaltyShare?: number
  starterProbability?: number
  lineupStatus?: 'confirmed_starter' | 'bench' | 'unknown' | 'out'
}
```

## Confidence

- Lineup confirmado: `medium`.
- Sin lineup: `low`.
- Lesiones claras: jugador excluido o probabilidad casi cero.
- `high` queda reservado para una fase futura con datos mas robustos.

## Refresh near-kickoff

ISR de 1 hora puede no ser suficiente para alineaciones que salen 1 hora antes.

MVP:

- Server Action manual "Actualizar alineaciones".
- Protegida por auth/rate limit.
- Solo disponible cerca del kickoff.

Futuro:

- On-Demand Revalidation.
- Cron externo.

## UI

En seccion GOLEADORES:

- Badge `Alineacion confirmada` cuando aplique.
- Timestamp pequeño.
- Si no hay lineup: `Datos limitados`.
- Si jugador esta out: no mostrarlo como candidato principal.

## Riesgos

### Rate limit

Lineups por fixture pueden aumentar consumo.

Mitigacion: consultar solo near-kickoff y cachear.

### Datos tardios

La fuente puede no publicar alineaciones a tiempo.

Mitigacion: fallback historico y confianza baja.

### Complejidad UI

Demasiadas etiquetas pueden saturar.

Mitigacion: badge compacto y detalles en info tooltip.
