# Design: Fase 0 - Setup

## Arquitectura base

```
app/       -> rutas Next.js
components/ -> UI reutilizable
lib/data/ -> providers y normalizacion
lib/model/ -> modelos estadisticos
lib/db/    -> schema, cliente y escritura local
scripts/   -> tareas locales
```

## Decisiones

- Next.js App Router como framework principal.
- TypeScript estricto para contratos entre capas.
- Tailwind para diseño rapido y consistente.
- Vitest para pruebas unitarias de skills/modelos.
- SQLite local para desarrollo inicial.

## Riesgos

- Acoplar UI con DB/modelos demasiado pronto.
- Mezclar secretos en archivos commiteados.
- Crear estructura sin tests desde el inicio.
