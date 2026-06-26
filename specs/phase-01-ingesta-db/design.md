# Design: Phase 1 - Ingestion and DB

## Flow

```
External provider
   -> normalizer
   -> internal types
   -> DB/local cache
   -> agents/models
```

## Components

- `lib/data/providers/api-football.ts`
- `lib/data/providers/football-data.ts`
- `lib/data/fallback.ts`
- `lib/db/schema.sql`
- `lib/db/client.ts`
- `lib/data/teams-seed.ts`

## Decisions

- Keep providers out of models.
- Normalize IDs/teams before passing to predictions.
- Preserve fallback to protect availability.

## Risks

- ID differences between providers.
- APIs with null or incomplete fields.
- Limited quotas on free plans.
