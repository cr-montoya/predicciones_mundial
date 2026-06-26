# Design: Phase 3 - On-Demand Refresh

## Historical Flow

```
pnpm refresh
   -> external provider
   -> normalization
   -> DB/local cache
   -> prediction recompute
   -> freshness timestamp
```

## Decisions

- Manual refresh to control API consumption.
- No cron or persistent processes.
- Agents concentrate I/O.

## Current Note

In the current architecture, fixtures are updated via Vercel ISR at server runtime.
The local refresh remains useful for scripts and precomputed data.
