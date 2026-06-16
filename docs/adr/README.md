# Architecture Decision Records

Este directorio guarda decisiones técnicas relevantes del proyecto.

## Cuándo crear un ADR

Crear o actualizar un ADR cuando cambie cualquiera de estas áreas:

- Runtime o plataforma de deploy.
- Fuente de datos o proveedor externo.
- Storage, DB, cache o estrategia ISR.
- Modelo matemático o contrato principal del modelo.
- Autenticación, seguridad o CSP.
- Límites del harness entre Skills, Models, Agents y UI.

## Formato

```txt
docs/adr/
  0001-vercel-isr-runtime.md
  0002-odds-from-model-probabilities.md
```

## Estados

- `proposed`: decisión propuesta, todavía no adoptada.
- `accepted`: decisión adoptada por el proyecto.
- `superseded`: decisión reemplazada por otro ADR.

## Template

```md
# ADR <number>: <Decision Title>

## Status

proposed

## Context

<Problem, constraints, alternatives considered.>

## Decision

<Chosen path.>

## Consequences

### Positive

- 

### Negative

- 

### Neutral / Follow-up

- 

## Related

- Spec:
- PR:
```
