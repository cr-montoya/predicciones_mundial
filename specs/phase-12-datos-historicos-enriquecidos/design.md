# Design: Fase 12 - Datos historicos enriquecidos

## Flujo

```
fuentes historicas ampliadas
   -> historical-stats.json
   -> computeStrengths
   -> tournament-prediction.json
```

## Decisiones

- Mantener JSON versionado.
- Cambiar formulas solo si Analyst aprueba contrato.
- Validar outputs con sanity estadistico.

## Riesgos

- Sesgo por competiciones con nivel desigual.
- Datos viejos con peso excesivo.
- Cambios de probabilidades sin explicacion.
