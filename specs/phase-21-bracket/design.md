# phase-21-bracket — Design

## Ruta

`app/bracket/page.tsx` — Server Component, `revalidate = 3600`.

## Arquitectura

```
app/bracket/page.tsx  (Server Component)
  ↓ loadFixtures() → filtra por round !== 'group'
  ↓ buildStaticTeams() → teamMap
  ↓ computePredictionsForFixture() → result_1x2 por cruce
  → <BracketView rounds={...} />  (Server Component)
      → <BracketRound> → <BracketMatchup>
```

## Estructura de rondas (WC 2026)

```
Round of 32 (16 partidos)
  → Round of 16 (8 partidos)
    → Quarter Finals (4 partidos)
      → Semi Finals (2 partidos)
        → Final (1 partido)
        → 3rd Place (1 partido)
```

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `app/bracket/page.tsx` | Server Component principal |
| `components/bracket-view.tsx` | Layout visual del cuadro completo |
| `components/bracket-matchup.tsx` | Cruce individual: equipos + probs + resultado |

## Diseño visual de `BracketMatchup`

```
┌──────────────────────────────┐
│  🇦🇷 Argentina       65%  →  │
│  ─────────────────────────── │
│  🇩🇪 Germany         35%     │
└──────────────────────────────┘
```

- Partido jugado: mostrar marcador real, ganador en acento dorado.
- Partido pendiente: mostrar probabilidades del modelo con barra.
- Slot vacío: `Por definir` en color muted.

## Layout en móvil

Scroll horizontal con una columna por ronda. En desktop: grid de columnas con
líneas conectoras SVG simples entre cruces.

## Nav

Agregar link "BRACKET" en `app/layout.tsx` junto a GRUPOS y FIXTURES.

## Security and Runtime

- Server Component con ISR `revalidate = 3600`. Sin secrets expuestos al cliente.
- `FOOTBALLDATA_KEY` solo en el agent (`live-loader`), nunca en UI.
- Los fixtures de eliminatorias pueden estar vacíos; manejar array vacío sin error.

## Testing Strategy

- No hay nueva lógica matemática — el modelo existente ya está testeado.
- Test manual: verificar que slots vacíos no rompen el render.
- Test manual: verificar partidos jugados muestran marcador; pendientes muestran probs.
- `pnpm build` es el gate principal (verifica que el Server Component compila).
