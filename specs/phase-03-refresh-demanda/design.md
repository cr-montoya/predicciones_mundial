# Design: Fase 3 - Refresh bajo demanda

## Flujo historico

```
pnpm refresh
   -> provider externo
   -> normalizacion
   -> DB/cache local
   -> recomputo de predicciones
   -> timestamp de frescura
```

## Decisiones

- Refresh manual para controlar consumo de API.
- Sin cron ni procesos persistentes.
- Agents concentran I/O.

## Nota actual

En la arquitectura vigente, fixtures se actualizan mediante Vercel ISR en runtime server.
El refresh local sigue siendo util para scripts y datos precomputados.
