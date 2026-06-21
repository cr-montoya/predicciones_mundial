# phase-25-match-context — Design

## Posición en `app/fixtures/[id]/page.tsx`

La sección CONTEXTO va entre `<FixtureHeader>` y los mercados de predicción.
Encuadra la predicción con antecedentes antes de mostrar las probabilidades.

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `lib/agents/h2h-loader.ts` | Agent: fetch H2H desde football-data.org con timeout y fallback |
| `components/match-context.tsx` | Server Component: forma reciente + H2H |
| `components/form-strip.tsx` | Badges W/D/L para los últimos partidos de un equipo |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/fixtures/[id]/page.tsx` | Agregar `<MatchContext>` entre header y mercados |

## Contrato de `h2h-loader.ts`

```ts
export interface H2HMatch {
  date: string      // ISO
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
}

export async function loadH2H(
  teamAId: number,
  teamBId: number,
): Promise<H2HMatch[]>  // máx 5, vacío si falla o no hay datos
```

Timeout: 2000ms vía `apiFetch({ timeoutMs: 2000 })` (usa `AbortSignal.timeout`, patrón existente — evita requests colgados).
Si falla o hace timeout → retorna `[]`. Envoltura en `try/catch`.

Null-safety: después de filtrar `status === 'FINISHED'`, descartar matches donde
`score.fullTime.home === null || score.fullTime.away === null` (edge case: AWARDED matches).

## Forma reciente

Se calcula desde `loadFixtures()` (ya disponible en el server component) filtrando
por `homeTeamId | awayTeamId` con `status === 'finished'`, ordenados por
`kickoffUtc` descendente. Máx. 3 partidos por equipo.

## Diseño visual

### Sistema visual base

| Token | Valor |
|---|---|
| Card bg | `#12141a` (`var(--card-bg)`) |
| Card border | `1px solid rgba(255,255,255,0.04)` (`var(--border)`) |
| Text | `var(--text)` |
| Muted | `var(--muted)` `#6b6d75` |
| Accent | `var(--accent)` `#FFDB00` |
| Green (G) | `#02B906` bg `rgba(2,185,6,0.12)` |
| Grey (E) | `#6b6d75` bg `rgba(107,109,117,0.12)` ← NO amarillo |
| Red (P) | `#ef4444` bg `rgba(239,68,68,0.12)` |

### Sección CONTEXTO

Header de sección (`text-xs tracking-widest font-bold uppercase`, color `var(--accent)`, `border-b pb-2`). Copy: `CONTEXTO`. La sección entera se omite si forma y H2H están vacíos.

Insertar en `app/fixtures/[id]/page.tsx` entre el bloque PickPanel (línea 285) y los mercados, usando `<FadeIn delay={0.08}>`.

### Forma reciente

Subsección label: `text-[11px] font-bold uppercase tracking-wider` color `var(--muted)`. Copy: `Forma reciente` (sin paréntesis explicativo).

Dos filas de card (una por equipo). Estructura de cada fila:
- Card: `background: var(--card-bg)`, border `var(--border)`, `borderRadius: 8`, `padding: 10px 14px`, flex row, gap-3.
- Columna nombre: `width: 132, flexShrink: 0` — bandera (emoji, fontSize 15) + nombre (text-[13px] font-medium, ellipsis).
- Badges: `WdlBadge` (ver abajo), gap-1.5. Máx 3, más reciente a la izquierda.

Badge `WdlBadge` — **extraer** del componente existente en `team-fixtures.tsx` lines 28-51 a `components/wdl-badge.tsx` y reusar en ambos lugares:
- Box: `width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700`, inline-flex centered.
- G verde / E gris / P rojo (los colores de arriba). Draw es gris, NO amarillo.

Si solo un equipo tiene partidos: mostrar fila del otro con texto faint `Sin partidos aún`. Si ninguno tiene partidos: no renderizar subsección.

### Encuentros en este Mundial

Renderizar como result-cards (NO tabla HTML). Subsección label igual al de forma. Copy: `Encuentros en este Mundial`.

Cada meeting → card con estructura:
1. **Tag de fase** (`text-[10px] font-bold uppercase tracking-wider` muted, bg `rgba(255,255,255,0.04)`, borderRadius 3, padding `2px 6px`, `flexShrink: 0`).
2. **Marcador centrado**: nombre home (flex-1 text-right ellipsis) + score (`text-[15px] font-bold tabular-nums`, dash muted `–`) + nombre away (flex-1 text-left ellipsis).

Score: `3 – 0` (en-dash muted). NO `3 - 0`.

Fases en español:

| Stage code FD | Label |
|---|---|
| `GROUP_STAGE` | `Fase de grupos` |
| `ROUND_OF_32` | `Dieciseisavos` |
| `ROUND_OF_16` | `Octavos` |
| `QUARTER_FINALS` | `Cuartos` |
| `SEMI_FINALS` | `Semifinal` |
| `THIRD_PLACE` | `3er puesto` |
| `FINAL` | `Final` |

Se muestra solo si hay al menos un encuentro. Principalmente visible en octavos en adelante.

## Security and Runtime

- `h2h-loader.ts` es un Agent: usa `FOOTBALLDATA_KEY` server-side, nunca expuesto.
- Timeout de 2000ms con `apiFetch({ timeoutMs: 2000 })` (AbortSignal.timeout, patrón del proyecto).
- Si el API falla o devuelve 429 → retorna `[]` silenciosamente.

## Testing Strategy

- Forma: equipo con 2 partidos jugados → forma con 2 badges.
- Forma: equipo sin partidos → subsección forma no se renderiza.
- H2H: mock de respuesta vacía del API → sección H2H no aparece.
- H2H: timeout de 2s → la página renderiza sin la sección H2H.
- `pnpm tsc --noEmit` valida el contrato de `H2HMatch`.
