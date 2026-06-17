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

---

## Data Contracts

### Data Contract: API-Football Lineups Endpoint

#### Owner Layer

Agent — `lib/agents/lineups-loader.ts`

#### Source

- Provider/file: API-Football RapidAPI — `GET /fixtures/lineups?fixture={fixtureId}`
- Runtime: server-side only; env vars `API_KEY` / `RAPIDAPI_KEY` y `API_HOST` / `RAPIDAPI_HOST`
- Cache/ISR: en memoria por `fixtureId` durante la vida del proceso; ISR no aplica (near-kickoff window)

#### Input Shape

```ts
interface LineupsLoaderInput {
  fixtureId: number
  kickoffUtc: string  // ISO 8601 UTC
}
```

#### Raw API Response Shape

```ts
interface ApiLineupTeam {
  team: { id: number; name: string }
  formation: string | null
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null }
  }>
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null }
  }>
}

interface ApiLineupsResponse {
  response: ApiLineupTeam[]   // len 0 si no hay lineup; len 2 si confirmado
  errors?: Record<string, string>
}
```

#### Output Shape

```ts
type LineupStatus = 'confirmed_starter' | 'bench' | 'unknown' | 'out'

interface LineupPlayer {
  playerId: number
  playerName: string
  teamId: number
  status: LineupStatus
}

interface FixtureLineupData {
  fixtureId: number
  confirmedAt: string         // ISO 8601 — timestamp de la respuesta API
  players: LineupPlayer[]     // titulares y suplentes de ambos equipos
}
```

#### Nullability and Fallbacks

- Retorna `null` si el kickoff es más de 2h en el futuro.
- Retorna `null` si la API responde con `response.length === 0`.
- Retorna `null` si la API lanza error o supera rate limit.
- Con `null`, `scorers.ts` aplica fallback historico: `starterProbability` estimado por posicion (`FW=0.7`, `MF=0.5`, `DF=0.3`, `GK=0`), confidence `'low'`.

#### Errors

- Rate limit superado: retorna `null`; loguea warning.
- API key ausente: lanza en `getEnvVars()` — el agent captura y retorna `null`.
- Timeout/red: capturado en bloque try/catch; retorna `null`.
- No se loguean payloads completos de la respuesta en produccion.

#### Security

- Secrets: `API_KEY`/`RAPIDAPI_KEY` solo en env server-side; nunca `NEXT_PUBLIC_`.
- Client exposure: `lineups-loader.ts` vive en `lib/agents/`; Client Components no lo importan.
- Quotas: el `RateLimiter` existente (`95 req/day`) cubre esta llamada. Llamar solo near-kickoff para no agotar cuota.

#### Validation

- `response.length` debe ser exactamente 0 o 2; cualquier otro valor logueado como anomalia.
- `startXI.length` esperado entre 10 y 11; fuera de rango logueado como warning.
- Tests: lineup completo (2 equipos, 11 titulares c/u), lineup vacío (0 equipos), API error.

---

### Data Contract: API-Football Injuries Endpoint

#### Owner Layer

Agent — `lib/agents/lineups-loader.ts` (mismo loader, llamada opcional)

#### Source

- Provider/file: API-Football RapidAPI — `GET /injuries?fixture={fixtureId}`
- Runtime: server-side only
- Cache/ISR: bundled junto al lineup por `fixtureId`

#### Raw API Response Shape

```ts
interface ApiInjuryItem {
  player: { id: number; name: string }
  team: { id: number }
  fixture: { id: number }
  injury: { type: string; reason: string }
}

interface ApiInjuriesResponse {
  response: ApiInjuryItem[]
  errors?: Record<string, string>
}
```

#### Output Shape

```ts
type InjuryType = 'out' | 'doubtful' | 'suspended'

interface PlayerInjuryData {
  playerId: number
  playerName: string
  teamId: number
  injuryType: InjuryType
  starterProbabilityOverride: number  // 0 para out/suspended; 0.2 para doubtful
}
```

#### Nullability and Fallbacks

- Retorna `[]` si la API no responde, retorna array vacio, o no hay datos de lesiones.
- No bloquea el render: el modelo opera sin datos de injuries si no estan disponibles.

#### Errors

- Mismos patrones que el endpoint de lineups: try/catch → `[]`.

#### Security

- Misma API key que lineups. Un solo proveedor, un solo rate limit compartido.

#### Validation

- Tests: jugador `out`, jugador `doubtful`, jugador `suspended`, array vacio.

---

### Data Contract: PlayerScorerInput (Model)

#### Owner Layer

Model — `lib/model/scorers.ts`

#### Source

- Datos normalizados por `lib/agents/lineups-loader.ts` + squad historico (`lib/data/squads`)
- No llama APIs; recibe input ya preparado

#### Input Shape

```ts
interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  goalsPerMinute: number           // historico; > 0
  starterProbability: number       // [0, 1]; 1.0 si titular confirmado; estimado si sin lineup
  lineupStatus: LineupStatus       // 'confirmed_starter' | 'bench' | 'unknown' | 'out'
  penaltyShare?: number            // opcional; [0, 1]
}
```

#### Mapping desde Player y FixtureLineupData

| Escenario | starterProbability | lineupStatus |
|---|---|---|
| Titular confirmado | 1.0 | `'confirmed_starter'` |
| Suplente confirmado | 0.1 | `'bench'` |
| Sin lineup — FW | 0.7 | `'unknown'` |
| Sin lineup — MF | 0.5 | `'unknown'` |
| Sin lineup — DF | 0.3 | `'unknown'` |
| Sin lineup — GK | 0.0 | `'unknown'` |
| Lesionado / suspendido | 0.0 | `'out'` |
| Duda (`doubtful`) | 0.2 | `'unknown'` |

#### Output Shape

Sin cambio en `ModelOutput`; confidence cambia segun disponibilidad:

- Lineup confirmado: `'medium'`
- Sin lineup: `'low'`
- `'high'` reservado para fase futura con xG por partido

#### Nullability and Fallbacks

- Jugadores con `lineupStatus === 'out'` o `starterProbability === 0` son excluidos del ranking.
- Si no hay ningún `PlayerScorerInput`, `buildScorerOutputs` retorna `emptyOutput` (comportamiento ya existente).

#### Validation

- `starterProbability` debe estar en `[0, 1]`; fuera de rango es error en sanity check.
- Tests: todos titulares, todos sin lineup, un jugador lesionado.

---

### Data Contract: lineups-loader Agent Output

#### Owner Layer

Agent — `lib/agents/lineups-loader.ts`

#### Output Shape

```ts
interface LineupsLoaderOutput {
  lineup: FixtureLineupData | null
  injuries: PlayerInjuryData[]
  scorerInputs: PlayerScorerInput[]  // listo para pasar a scorers.ts
}
```

#### Cache

- Cache en memoria por `fixtureId` dentro del proceso ISR.
- Near-kickoff window: solo consulta la API si `now >= kickoffUtc - 2h`.
- Sin cache externo en MVP; On-Demand Revalidation queda para fase futura.

#### ADR relacionado

Ver `docs/adr/0002-api-football-lineups-near-kickoff.md`.
