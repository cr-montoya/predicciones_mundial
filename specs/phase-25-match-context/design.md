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

Timeout: 2000ms con `Promise.race`. Si falla → retorna `[]`.

## Forma reciente

Se calcula desde `loadFixtures()` (ya disponible en el server component) filtrando
por `homeTeamId | awayTeamId` con `status === 'finished'`, ordenados por
`kickoffUtc` descendente. Máx. 3 partidos por equipo.

## Diseño visual

### Forma
```
FORMA RECIENTE (últimos partidos del torneo)
Argentina:  [G] [E] [G]
France:     [G] [G] [P]
```

Badges: `G` verde / `E` amarillo / `P` rojo.

### H2H
```
HISTORIAL H2H EN MUNDIALES
Argentina 3 - 0 France   · 2022
France    4 - 3 Argentina · 2018 (pen.)
```

## Security and Runtime

- `h2h-loader.ts` es un Agent: usa `FOOTBALLDATA_KEY` server-side, nunca expuesto.
- Timeout de 2000ms con `Promise.race` para no degradar el ISR de la fixture page.
- Si el API falla o devuelve 429 → retorna `[]` silenciosamente.

## Testing Strategy

- Forma: equipo con 2 partidos jugados → forma con 2 badges.
- Forma: equipo sin partidos → subsección forma no se renderiza.
- H2H: mock de respuesta vacía del API → sección H2H no aparece.
- H2H: timeout de 2s → la página renderiza sin la sección H2H.
- `pnpm tsc --noEmit` valida el contrato de `H2HMatch`.
