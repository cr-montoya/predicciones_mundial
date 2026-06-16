# Design: Fase 1 - Ingesta y DB

## Flujo

```
Provider externo
   -> normalizador
   -> tipos internos
   -> DB/cache local
   -> agents/modelos
```

## Componentes

- `lib/data/providers/api-football.ts`
- `lib/data/providers/football-data.ts`
- `lib/data/fallback.ts`
- `lib/db/schema.sql`
- `lib/db/client.ts`
- `lib/data/teams-seed.ts`

## Decisiones

- Mantener providers fuera de modelos.
- Normalizar IDs/equipos antes de pasar a predicciones.
- Conservar fallback para proteger disponibilidad.

## Riesgos

- Diferencias de IDs entre providers.
- APIs con campos nulos o incompletos.
- Cuotas limitadas de planes gratuitos.
