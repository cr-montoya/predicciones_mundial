# Design: Fase 8 - Datos historicos

## Datos

`historical-stats.json` contiene valores normalizados de ataque/defensa.

## Flujo

```
historical-stats.json
   -> strength batch / computeStrengths
   -> equipos calibrados
   -> match model / Monte Carlo
```

## Decisiones

- Mantener datos historicos como JSON versionado.
- Evitar red durante modelo.
- Ajustar fuerzas antes de simular torneo.

## Riesgos

- Datos incompletos o sesgados.
- Sobreponderar torneos cortos.
- Cambios bruscos sin tests.
