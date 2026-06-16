# Design: Fase 2 - Modelo de prediccion

## Capas

```
skills puras
   -> score matrix / poisson / confidence
models
   -> outputs por mercado
agents
   -> proveen fixtures/equipos/stats normalizados
```

## Componentes

- `lib/model/skills/poisson.ts`
- `lib/model/skills/score-matrix.ts`
- `lib/model/skills/derive-markets.ts`
- `lib/model/match-model.ts`
- `lib/model/montecarlo.ts`
- `lib/model/sanity.ts`

## Contrato

Cada salida relevante debe incluir mercado, probabilidades, confianza, version y timestamp.

## Riesgos

- Probabilidades degeneradas.
- Lambdas fuera de rango.
- Mezclar I/O con math.
