# Live Top Scorers — Design

## Context

La sección "Candidatos a Bota de Oro" muestra probabilidades del modelo Monte Carlo
precomputadas en `lib/data/tournament-prediction.json`. Este JSON solo se actualiza
cuando se corre `pnpm precompute` manualmente, lo que significa que durante el torneo
los goles reales de los jugadores (y por tanto las probabilidades) quedan desactualizados.

La solución extiende el agente `live-loader` para obtener goleadores reales en runtime
con ISR, y enriquece la UI para mostrar goles actuales junto a la probabilidad.

El endpoint `football-data.org /v4/competitions/WC/scorers` ya se usa en el script
`precompute-tournament.ts` (líneas 35-55), así que la lógica de fetch es conocida y
verificada.

## Architecture

- **Skills**:
  - Nueva skill pura `lib/skills/normalize-scorer-name.ts` que exporta:
    - `normalizeName(name: string): string` — quita diacríticos, lowercase, trim.
    - `mergeScorersWithCandidates(candidates: CandidateRow[], liveScorers: LiveScorer[]): CandidateRow[]`
      — función pura que fusiona probabilities del JSON con goles reales, sin I/O.
  - La misma `normalizeName` la importa `scripts/precompute-tournament.ts` para no
    duplicar lógica (reemplaza la función `normalize` local del script).
- **Models**: sin cambios al modelo Monte Carlo.
- **Agents**: extender `lib/agents/live-loader.ts` con `fetchLiveScorers(): Promise<LiveScorer[]>` que llama al endpoint, parsea a `LiveScorer[]` y aplica ISR. El agente llama a la skill de fusión con los candidatos del JSON y los scorers reales, devolviendo `CandidateRow[]` listos para la UI.
- **UI**: `components/candidates.tsx` recibe `candidates: CandidateRow[]` (ya fusionados y ordenados) y `computedAt: string`. Solo renderiza — no importa `lib/agents`, `lib/model` ni `lib/skills`.

## Data and Contracts

### Tipo `LiveScorer`

```ts
// lib/skills/normalize-scorer-name.ts
interface LiveScorer {
  playerId: number      // player.id de la API; 0 si el campo no viene en la respuesta
  playerName: string    // player.name de la API
  teamId: number        // toCanonicalTeamId(team.id) usando FD_TEAM_MAP
  goals: number         // solo entradas con goals > 0
  assists: number       // 0 si el tier de football-data.org no lo incluye
}
```

`FD_TEAM_MAP` debe extraerse a `lib/data/fd-team-map.ts` (evitar duplicación:
actualmente existe en `lib/data/providers/football-data.ts` y en
`scripts/precompute-tournament.ts`). El agente importa el mapa desde `lib/data/`.

### Endpoint

```
GET https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=50
Headers: { 'X-Auth-Token': process.env.FOOTBALLDATA_KEY }
```

Respuesta esperada (simplificada):
```json
{
  "scorers": [
    {
      "player": { "id": 44, "name": "Lionel Messi" },
      "team": { "id": 762, "name": "Argentina" },
      "goals": 5,
      "assists": 2
    }
  ]
}
```

`assists` puede estar ausente en el plan gratuito; el parser debe defaultear a `0`.
`player.id` puede estar ausente; el parser debe defaultear a `0`.

### Merge de candidatos

```ts
// lib/skills/normalize-scorer-name.ts
export interface CandidateRow {
  playerName: string
  teamId: number | null        // para join name+team; null si no disponible en JSON
  probability: number | null   // del JSON precomputado; null si no está en el top
  goals: number | null         // de live scorers; null si no tiene goles en el torneo
}

export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function mergeScorersWithCandidates(
  candidates: CandidateRow[],
  liveScorers: LiveScorer[],
): CandidateRow[]
```

Lógica de fusión (en la skill pura, llamada desde `lib/agents/live-loader.ts`):
1. Tomar candidatos del JSON precomputado (todos, sin límite de 5).
2. Tomar scorers reales con goles > 0.
3. Unir por **`normalizeName(playerName) + teamId`** como clave compuesta (elimina
   colisiones por monónimos o apellidos comunes). Fallback a solo-nombre si el
   candidato del JSON no tiene `teamId`. `LiveScorer.teamId` ya está en el contrato,
   y `CandidateRow` debe incluir `teamId: number | null` para habilitar este join.
4. Resultado: lista única — jugadores que aparecen en al menos una fuente.
5. Ordenar:
   - Primero: jugadores con goles reales (desc por goles).
   - Tiebreak dentro de ese grupo: desc por probabilidad.
   - Luego: jugadores sin goles reales (desc por probabilidad).
6. La UI muestra top 5 colapsado, expandible al total (igual que hoy).

### Cache / ISR

Usar `apiFetch` de `lib/data/api-fetch.ts` en lugar de `fetch` directo, para
heredar el `AbortSignal.timeout(10s)`, el backoff de 3 intentos y el `RateLimiter`
ya configurado para football-data.org. Pasar `{ revalidate: DATA_REVALIDATE_SECONDS }`
como opción de cache. Validar `Array.isArray(data?.scorers)` antes de mapear para
resistir envelopes de error con 2xx.

### Fallback

Si el fetch falla o devuelve `scorers` vacío:
- Devolver `[]` como `liveScorers`.
- La UI muestra candidatos del JSON precomputado con goles `null` (columna `—`).
- Sin error visible al usuario.

## UX and Content

### Columna de goles

- Columna fija entre nombre y `%`: `w-16 text-right shrink-0 tabular-nums`.
- Si `goals === null` o `goals === 0`: mostrar `—` en tono gris muted (`#555`).
- Si `goals >= 1`: mostrar `1 gol` / `5 goles` (singular/plural). El número en verde
  (`#02B906`) distingue los datos reales del modelo (oro `#FFDB00`/`#D4A843`).
- No usar "actual" — simplemente `5 goles`.

### Orden visual

- El jugador con más goles reales aparece primero, incluso si tiene probabilidad más
  baja que otro candidato.
- El rango numérico (1, 2, 3…) debe reflejar el nuevo orden fusionado.

### Fecha del último precompute

- Mostrar `computedAt` del JSON bajo el título de la sección en formato
  `Probabilidades calculadas: DD/MM/YYYY` en tono gris tenue (`#6b6d75`, 11px).
- La etiqueta acota explícitamente al modelo (no a los goles reales, que son más
  frescos vía ISR).

### Empty state / loading

- Si `liveScorers` vacío y JSON tiene candidatos: mostrar candidatos sin columna de
  goles (sin columna extra ni mensaje de error).
- No hay loading skeleton (Server Component con ISR).

## Security and Runtime

- `FOOTBALLDATA_KEY` debe usarse exclusivamente en `lib/agents/live-loader.ts` (server-
  side). Nunca pasar la key al cliente ni a variables `NEXT_PUBLIC_`.
- El fetch ocurre en el Server Component tree; ningún Client Component toca el agent.
- ISR garantiza que el request no se hace en cada visita, solo al expirar el cache.
- El endpoint de scorers de football-data.org tiene límite de requests según plan;
  con ISR de 3600 s el impacto es mínimo (1 request/hora por ruta, no por visita).

## Testing Strategy

- **Unit**: test del parser/normalizer de la respuesta de scorers (datos mock).
- **Unit**: test de la lógica de fusión (merge) con datos conocidos — verificar que
  Messi con 5 goles aparece primero aunque su probabilidad precomputada sea baja.
- **Unit**: test del fallback cuando el fetch falla (retorna `[]`).
- **Build**: `pnpm build` debe pasar sin errores de tipos.
- **Manual**: verificar en preview de Vercel que la sección muestra goles reales.
- **Manual**: verificar que si se desactiva `FOOTBALLDATA_KEY`, la sección sigue
  mostrando candidatos del JSON (degradación).
