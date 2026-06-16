# Design: Fase 16 — Goleadores y mercados extendidos

## Enfoque

Derivar tantos mercados como sea posible desde la matriz de marcador existente. Esto evita
agregar complejidad innecesaria y mantiene el modelo barato para Vercel ISR.

Los mercados de goleadores son más inciertos. Deben tener un contrato separado y degradar
con elegancia cuando falten datos de titulares, minutos o jugadores.

## Arquitectura propuesta

```
lib/model/skills/derive-markets.ts
   -> mercados derivados desde score matrix

lib/model/scorers.ts
   -> goleadores desde lambda del equipo + player rates

lib/agents/live-loader.ts
   -> fixtures runtime + predicciones baratas

app/fixtures/[id]/page.tsx
   -> detalle enriquecido

components/market-section.tsx
components/player-scorers.tsx
   -> UI de mercados y goleadores
```

## Mercados derivados desde matriz de marcador

La matriz exact score permite derivar sin datos extra:

- 1X2.
- Over/Under goles.
- BTTS.
- Team totals.
- Resultado + BTTS.
- Resultado + Over.
- Clean sheet.
- Gana a cero.
- Margen de victoria simple.

Estas derivaciones deben vivir en skills puras.

## Team totals

Para cada equipo:

```ts
P(homeGoals > line)
P(awayGoals > line)
```

Líneas iniciales:

- 0.5
- 1.5
- 2.5

## Combinados

Ejemplos:

- `home_win_btts_yes`
- `draw_over_1_5`
- `away_win_over_2_5`
- `home_win_to_nil`
- `away_win_to_nil`

Evitar demasiados combinados visibles. La UI debe priorizar top mercados por score/confianza.

## Goleadores

Input mínimo sugerido:

```ts
interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  expectedMinutes: number
  goalsPer90: number
  penaltyShare?: number
  starterProbability?: number
}
```

Modelo:

1. Calcular participación ofensiva esperada del jugador.
2. Asignar porción del lambda del equipo.
3. Convertir a probabilidad de anotar con Poisson:

```txt
P(score anytime) = 1 - exp(-playerLambda)
```

Primer goleador debe ser opcional y solo mostrarse si hay suficiente data.

## Datos de jugadores

Fuente preferida:

- API-Football player stats.
- Lineups/minutos recientes si están disponibles.

Fallback:

- Dataset manual/precomputado por jugador.
- Si no hay data: no mostrar goleadores o marcar confianza baja.

No bloquear el detalle del partido por falta de jugadores.

## UI

Orden sugerido del fixture detail:

1. Hero del partido.
2. Mercado principal: resultado / probabilidad dominante.
3. Goles esperados y team totals.
4. Top combinados.
5. Tarjetas/corners.
6. Goleadores, si hay datos.
7. Disclaimer y timestamp.

Mantener 3-5 mercados principales visibles y el resto en secciones expandibles.

## Performance

Los mercados derivados desde matriz son baratos. Goleadores pueden ser más caros si hay
muchos jugadores; limitar a top N por equipo.

Recomendación inicial:

- Top 5 goleadores por equipo.
- No calcular primer goleador si faltan titulares/minutos.

## Riesgos

### Falsa precisión en goleadores

Sin datos de alineación, el mercado puede parecer más confiable de lo que es.

Mitigación: confianza baja y copy claro.

### Demasiados mercados

La página puede saturarse.

Mitigación: ranking visual, secciones plegables y top markets.

### API rate limit

Traer stats de jugadores por partido puede aumentar llamadas.

Mitigación: cache ISR, fallback precomputado y no bloquear render.
