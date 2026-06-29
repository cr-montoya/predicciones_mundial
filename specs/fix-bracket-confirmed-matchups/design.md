# Fix Bracket Confirmed Matchups — Design

## Context

Fase de grupos terminada. El API de football-data.org ya devuelve los 16 fixtures de Ronda de 32 con equipos reales. El bracket solo necesita priorizar esos datos sobre las proyecciones computadas.

## Architecture

- **Skills**: `computeGroupStandings`, `getGroupPosition`, `getBestThird` en `lib/skills/standings.ts` — sin cambios, siguen siendo el fallback.
- **Models**: sin cambios.
- **Agents**: `lib/agents/live-loader.ts` — sin cambios estructurales; ya devuelve todos los fixtures incluyendo knockout.
- **UI**: sin cambios visuales.
- **Page** (`app/bracket/page.tsx`): aquí vive el fix. Cambio en la lógica de resolución de equipos por matchup.

## El Bug

```typescript
// ACTUAL (líneas 54-66): confirmedTeams se construye pero nunca se usa
const confirmedTeams = new Map<string, { homeId: number; awayId: number }>()
for (const f of allFixtures) {
  if (!f.round || f.round.startsWith('Group Stage')) continue
  // ...
  confirmedTeams.set(String(f.id), { homeId: f.homeTeamId, awayId: f.awayTeamId })
}

// ACTUAL (líneas 68-98): siempre usa resolveSlot (standings), ignora confirmedTeams
const matchups: ResolvedMatchup[] = ROUND_OF_32_DEFS.map(def => {
  const home = resolveSlot(def.home, standings, byId)
  const away = resolveSlot(def.away, standings, byId)
  // ...
})
```

## Data and Contracts

### Fixture shape relevante (de `lib/types.ts`)

```typescript
interface Fixture {
  id: number
  homeTeamId: number    // puede ser 0 o null cuando TBD
  awayTeamId: number    // puede ser 0 o null cuando TBD
  round: string         // e.g. "LAST_32" para Ronda de 32
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  homeGoals: number | null
  awayGoals: number | null
  kickoffUtc: string
}
```

### Problema de mapeo matchId → fixture del API

`ROUND_OF_32_DEFS` usa IDs ficticios (`M73`–`M88`) que no corresponden a IDs reales de fixture del API. La football-data.org devuelve fixtures con `id` numérico y la ronda en `round`.

**Estrategia**: Construir un mapa de knockout fixtures por pares de equipos (`homeTeamId, awayTeamId`) → fixture. Luego, cuando `resolveSlot` devuelva dos equipos confirmados, verificar si existe un fixture confirmado en el API con exactamente esos dos equipos (en cualquier orden) para obtener el resultado real si ya se jugó.

Pero el problema principal es distinto: cuando el API ya tiene un fixture de Ronda de 32 con equipos reales (homeTeamId y awayTeamId no-nulos, aunque el partido no se haya jugado aún), hay que usar esos equipos directamente sin esperar a que `resolveSlot` los compute desde standings.

**Estrategia de resolución mejorada**:

1. Construir un índice de knockout fixtures confirmados: `Map<string, Fixture>` donde la clave es `${homeTeamId}:${awayTeamId}` normalizado (ambas combinaciones).
2. Para cada `BracketMatchupDef`, intentar primero encontrar un fixture del API en la ronda LAST_32 donde ambos equipos estén confirmados.
3. Si no hay fixture confirmado del API, usar `resolveSlot` como fallback.

Alternativa más simple: como el API devuelve los fixtures ordenados y con ronda, se puede crear un mapa de equipos confirmados en Ronda de 32 y para cada matchup del bracket, verificar si los equipos computados por standings coinciden con algún par confirmado, o directamente indexar por equipos.

**Estrategia recomendada (más simple y directa)**:

Crear `confirmedR32Fixtures`: array de fixtures con `round === 'LAST_32'` (u otras variantes del string de ronda) y donde `homeTeamId` y `awayTeamId` son no-nulos y non-zero.

Para cada `BracketMatchupDef`:
1. Intentar resolver los equipos desde `resolveSlot` (como hoy).
2. Si ambos equipos se resuelven, verificar si hay un fixture confirmado del API con esos dos equipos (sin importar el orden home/away, ya que el bracket local puede diferir del orden real).
3. Si hay un fixture confirmado con resultado (`status === 'finished'`), usar ese resultado.
4. Si el API tiene el mismo par pero los equipos en orden distinto al que `resolveSlot` calculó, el equipo que muestra el bracket sigue siendo correcto (solo cambia quién es "local").

**Nota crítica**: El bug reportado (Colombia vs Ecuador en vez de Ghana) sugiere que `resolveSlot` está proyectando mal los standings porque `fixtures-cache.json` es stale. Refrescar la cache puede ser suficiente para el bug inmediato. El fix de código es preventivo para cuando el API ya confirme los equipos pero los standings locales sigan siendo distintos (por ejemplo, diferencias en criterios de desempate).

## UX and Content

Sin cambios visuales. El `positionLabel` en el bracket puede ajustarse:
- Cuando el equipo viene de un fixture confirmado del API: el label podría mostrar el grupo real (ej. "1° Grupo K") o simplemente el nombre del equipo.
- Actualmente `isProjected: true` siempre — si el equipo está confirmado por el API, podría ser `isProjected: false`.

Esto es opcional para este fix; el objetivo es que el nombre del equipo sea correcto.

## Security and Runtime

- No hay cambios de seguridad.
- ISR revalidate = 3600s en `app/bracket/page.tsx` — sin cambios.
- `pnpm refresh-fixtures` debe ejecutarse manualmente para actualizar `fixtures-cache.json` antes del deploy.

## Data Contract: confirmed-r32-fixtures

### Owner Layer

Agent (`lib/agents/live-loader.ts` → `FootballDataProvider.fetchFixtures`) → UI Server Component (`app/bracket/page.tsx`)

### Source

- Provider: `lib/data/providers/football-data.ts` — endpoint `competitions/WC/matches`
- Runtime: Server Component (Vercel ISR, revalidate=3600s)
- Cache local: `lib/data/fixtures-cache.json` (actualmente stale del 14 de junio)

### Input Shape

```ts
// Fixture ya normalizado que llega a bracket/page.tsx via loadFixtures()
interface Fixture {
  id: number
  homeTeamId: number   // siempre non-null y non-zero: el provider filtra TBD
  awayTeamId: number   // siempre non-null y non-zero: el provider filtra TBD
  kickoffUtc: string
  status: 'scheduled' | 'live' | 'finished'
  homeGoals: number | null   // null si no se ha jugado
  awayGoals: number | null   // null si no se ha jugado
  round: string | null       // raw API stage string para knockout: 'LAST_32', 'LAST_16', etc.
                             // 'Group Stage - Matchday N' para fase de grupos
}
```

### Output Shape

```ts
// Nuevo mapa construido en bracket/page.tsx
// Clave: "${Math.min(homeTeamId, awayTeamId)}:${Math.max(homeTeamId, awayTeamId)}"
// Valor: Fixture confirmado del API
type ConfirmedR32Pairs = Map<string, Fixture>

// ResolvedTeam actualizado para indicar si viene del API o de proyección
interface ResolvedTeam {
  teamId: number | null
  name: string | null
  positionLabel: string
  isProjected: boolean   // false cuando el equipo viene del fixture real del API
}
```

### Nullability y Fallbacks

- `homeTeamId` / `awayTeamId`: siempre non-null en los fixtures que pasan el filtro del provider (`item.homeTeam?.id != null`). Los fixtures TBD son eliminados antes de llegar al componente.
- `round`: puede ser null si el API no devuelve stage. La función `normalizeKnockoutStage` (de `lib/skills/bracket.ts`) retorna null para grupos y null si el string no está en `ROUND_MAP`. Para R32 devuelve `'round_of_32'`.
- Si el API no tiene fixtures R32 aún (grupo stage no terminado o cuota excedida): `confirmedR32Pairs` queda vacío, el bracket cae a `resolveSlot` como hoy. Degradación segura.

### Clave de round para filtrar R32

```ts
// CORRECTO: usar normalizeKnockoutStage de lib/skills/bracket.ts
import { normalizeKnockoutStage } from '@/lib/skills/bracket'

const r32Fixtures = allFixtures.filter(
  f => normalizeKnockoutStage(f.round) === 'round_of_32'
)
```

**No usar** `f.round === 'LAST_32'` directo: el API podría enviar `'ROUND_OF_32'` u otro alias. `ROUND_MAP` en bracket.ts cubre ambos.

### Errors

- API sin datos R32 (cuota excedida, API delayed): `r32Fixtures` vacío → bracket funciona con proyecciones, sin error en UI.
- Cache stale sin resultados de grupo completos: `computeGroupStandings` computa standings incorrectos → emparejamientos proyectados erróneos (el bug actual). Se resuelve con `pnpm refresh-fixtures`.

### Security

- Secrets: `FOOTBALLDATA_KEY` solo en el runtime de Vercel (variable de entorno server-side). No se expone al cliente.
- Client exposure: ninguna. `app/bracket/page.tsx` es Server Component.
- Quotas: 10 requests/min en el provider. Un revalidate de 1h evita rate-limiting.

### Validation

- `pnpm refresh-fixtures` → verificar que `fixtures-cache.json` tiene `count > 72` y que existen fixtures con `round: 'LAST_32'`.
- En `bracket/page.tsx`: `console.log` temporal con la cantidad de R32 fixtures confirmados encontrados.
- Acceptance: Colombia (id: 20) y Ghana (id: 135) deben aparecer como el par en el slot M83.

## Testing Strategy

1. Unit: verificar que `resolveSlot` como fallback sigue funcionando con fixtures vacíos.
2. Manual: abrir `/bracket` en el preview de Vercel y confirmar que los 16 partidos muestran los equipos correctos (especialmente Colombia vs Ghana en M83).
3. Build: `pnpm tsc --noEmit` y `pnpm build`.
