# ADR 0002: API-Football como fuente live de lineups e injuries near-kickoff

## Status

proposed

## Context

El mercado de goleadores de la fase 18 requiere saber si un jugador sera titular, suplente,
lesionado o suspendido. Sin esa informacion, el modelo usa solo tasas historicas y la
confianza es siempre `low`.

Las opciones evaluadas:

1. **API-Football (RapidAPI) — /fixtures/lineups e /injuries**: fuente establecida en el
   proyecto (ya usada en `ApiFootballProvider`). Publica alineaciones entre 60-90 min antes
   del kickoff. Misma API key que el proveedor existente.

2. **football-data.org**: fuente primaria del proyecto para fixtures. No expone endpoint de
   lineups ni injuries en el plan gratuito.

3. **Squads estaticos unicamente (status quo)**: ya implementado. Confianza `low` siempre.
   No mejora con la informacion disponible.

4. **Scraping manual**: fragil, violacion de TOS, descartado.

Restricciones:
- La API key de RapidAPI debe permanecer server-side.
- El rate limiter existente tiene cuota de 95 req/dia; los lineups deben consultarse solo
  near-kickoff para no agotar la cuota.
- ISR de 1h no es suficiente para alineaciones que se publican ~1h antes del kickoff.
- El modelo no debe bloquearse si los lineups no estan disponibles.

## Decision

Usar API-Football (RapidAPI) como fuente de lineups e injuries para el agente
`lib/agents/lineups-loader.ts`.

Reglas de consulta:
- Solo consultar si `now >= kickoffUtc - 2h` (near-kickoff window).
- Si el partido ya finalizo, no consultar.
- Cachear el resultado en memoria por `fixtureId` durante la vida del proceso ISR.
- Retornar `null` si no hay datos; el modelo aplica fallback historico.

Refresh near-kickoff (MVP):
- Server Action manual "Actualizar alineaciones", protegida, disponible solo near-kickoff.
- On-Demand Revalidation queda para una fase futura.

Rate limit:
- Las llamadas a lineups e injuries se contabilizan en el `RateLimiter` existente
  (`95 req/dia`) del `ApiFootballProvider`.
- Con 64 partidos del Mundial, y 2 endpoints por partido (lineups + injuries), el pico
  maximo es ~128 llamadas si todos los partidos se consultan en el mismo dia; en la practica
  los partidos se distribuyen en dias distintos.

## Consequences

### Positive

- Confianza del mercado de goleadores sube a `medium` cuando hay lineup confirmado.
- Jugadores lesionados o suspendidos se excluyen automaticamente del ranking.
- Reutiliza la infraestructura existente de `ApiFootballProvider` y `RateLimiter`.
- Degradacion limpia garantizada: `null` activa fallback sin romper la pagina.

### Negative

- Suma 1-2 llamadas API por partido near-kickoff; puede tensionar la cuota en dias con
  varios partidos simultaneos.
- La ventana de 2h es heuristica; si la fuente publica tarde, el lineup no estara
  disponible al momento de la consulta.
- Server Action MVP requiere intervencion manual; no es automatico.

### Neutral / Follow-up

- Evaluar On-Demand Revalidation con Vercel si el torneo activo exige actualizaciones
  automaticas.
- Si la cuota se agota, reducir a solo el endpoint de lineups (omitir injuries).
- Si surge un segundo proveedor con lineups gratuitos, este ADR se supersede con 0003.

## Related

- Spec: specs/phase-18-jugadores-lineups/
- Data contract: specs/phase-18-jugadores-lineups/design.md
- Provider existente: lib/data/providers/api-football.ts
- PR: (pendiente)
