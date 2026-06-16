# phase-24-team-page — Design

## Ruta

`app/teams/[id]/page.tsx` — Server Component, `revalidate = 3600`.

## Arquitectura

```
app/teams/[id]/page.tsx  (Server Component)
  ↓ buildStaticTeams() → teamMap → team
  ↓ loadFixtures() → filtra por homeTeamId | awayTeamId
  ↓ squadsByTeamId[id] → squad top
  → <TeamHeader> <ModelRatingBars> <TeamFixtures> <SquadTop>
```

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `app/teams/[id]/page.tsx` | Página principal del equipo |
| `components/model-rating-bars.tsx` | Visualización de attackStrength / defenseStrength |
| `components/team-fixtures.tsx` | Lista de partidos del equipo con resultado/predicción |
| `components/squad-top.tsx` | Top jugadores del equipo según el modelo |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/fixtures/[id]/page.tsx` | Nombres de equipo pasan a ser links a `/teams/[id]` |
| `app/groups/page.tsx` | Nombres de equipo en tabla linkean a `/teams/[id]` |

## Diseño visual

### ModelRatingBars

```
RATING DEL MODELO
Ataque   ████████░░  1.32  (arriba del promedio)
Defensa  █████░░░░░  0.88  (mejor que el promedio)
```

- Barra relativa: `(strength / 2.0) * 100%` para escala visual 0–2.
- Color: dorado `#FFDB00` si > 1.0, gris si ≤ 1.0.
- Subtexto: "arriba del promedio" / "promedio" / "por debajo del promedio".

### TeamFixtures

Lista de partidos del equipo ordenados cronológicamente:
- Scheduled: hora + rival + predicción top-1 del modelo.
- Finished: marcador real + W/D/L badge.

### SquadTop

Grid de jugadores (máx. 8): nombre + posición + tasa de goles por 90 min.
Solo FW y MF con `goalsPerMinute > 0`.

## Security and Runtime

- Server Component con ISR `revalidate = 3600`. Sin secrets al cliente.
- `FOOTBALLDATA_KEY` no se usa en esta página (todos los datos son estáticos).
- `notFound()` para IDs inválidos; sin exposición de datos internos.

## Testing Strategy

- `notFound()` para ID inexistente: `/teams/9999` → 404.
- Equipo sin squad en squads.json → `<SquadTop>` no se renderiza.
- Links desde fixture y grupos → navegan correctamente.
- `pnpm build` es gate principal.
