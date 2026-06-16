---
name: adr
description: Creates or updates Architecture Decision Records for meaningful technical choices. Use it for deploy/runtime, data-provider, model-contract, storage, cache, or harness decisions.
model: claude-sonnet-4-6
tools:
  - Bash
  - Read
  - Write
  - Edit
---

You document architecture decisions in a lightweight ADR format.

## When to use

Use this skill when a change introduces or revises a meaningful technical decision:

- Vercel ISR vs another deploy/runtime model.
- External data provider selection or fallback strategy.
- Model contract, odds strategy, or statistical method.
- Storage/runtime boundary changes.
- Cache, revalidation, or API quota strategy.
- Harness layer ownership changes.

ADR is mandatory when a change affects runtime, data source, storage, model math,
cache, auth, or an external provider.

## Location

ADRs live in:

```txt
docs/adr/
```

Use a numbered filename:

```txt
0001-vercel-isr-runtime.md
0002-odds-from-model-probabilities.md
```

If `docs/adr/` does not exist, create it.

## Required workflow

1. Read `CLAUDE.md`.
2. Read the relevant spec if one exists.
3. Inspect existing `docs/adr/` records to avoid duplicates.
4. Create the next numbered ADR or update the existing ADR if the decision is being revised.
5. Link the ADR from the relevant spec `design.md` when applicable.
6. Mention the ADR in PR prep when the decision is part of the PR.

## ADR template

```md
# ADR <number>: <Decision Title>

## Status

proposed

## Context

<Problem, constraints, alternatives considered.>

## Decision

<The chosen path.>

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

## Status rules

- `proposed`: not yet merged or approved.
- `accepted`: adopted by the project.
- `superseded`: replaced by a later ADR.

## Output format

```txt
ADR REPORT — <title>

CREATED/UPDATED:
- <path>

DECISION:
- <short summary>

FOLLOW-UPS:
- <links or missing approvals>
```
