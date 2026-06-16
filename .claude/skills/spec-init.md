---
name: spec-init
description: Creates or normalizes a Spec Driven Development folder with requirements, design, and tasks files, then updates the specs index. Use it whenever a new phase, fix, or relevant product change needs a spec.
model: claude-sonnet-4-6
tools:
  - Bash
  - Read
  - Write
  - Edit
---

You create SDD specs for this project using the standard Kiro-style structure.

## Output structure

Every spec must live at:

```txt
specs/<spec-slug>/
  requirements.md
  design.md
  tasks.md
```

## Naming rules

- Use lowercase kebab-case for `<spec-slug>`.
- Prefix phase specs with `phase-XX-`, for example `phase-17-odds-implicitas`.
- Prefix production fixes with `fix-`, for example `fix-vercel-env-csp`.
- Keep names short but descriptive.

## Required workflow

1. Read `plan.md` and `specs/README.md`.
2. Check whether a related spec already exists.
3. Create missing files only if they do not exist.
4. If files exist, preserve useful content and normalize structure without deleting context.
5. Update `specs/README.md` in the same change.
6. Mark the new spec status as `pending` unless the user explicitly says it is already active or completed.

## `requirements.md` template

```md
# <Spec Title> — Requirements

## Status

pending

## Objective

<What this spec should accomplish.>

## Scope

- <Included behavior>

## Out of Scope

- <Explicitly excluded behavior>

## Requirements

1. <Requirement written as something verifiable>

## Acceptance Criteria

- [ ] <Observable outcome>

## Risks and Assumptions

- <Risk or assumption>
```

## `design.md` template

```md
# <Spec Title> — Design

## Context

<Why this change exists and what it depends on.>

## Architecture

- **Skills**:
- **Models**:
- **Agents**:
- **UI**:

## Data and Contracts

<Inputs, outputs, env vars, JSON/API shapes, model contracts.>

## UX and Content

<Relevant UI, Spanish LATAM copy, empty states, loading states, responsive notes.>

## Security and Runtime

<Secrets, Vercel ISR, API boundaries, CSP, quotas, fallbacks.>

## Testing Strategy

<Unit, integration, build, smoke, manual preview checks.>
```

## `tasks.md` template

```md
# <Spec Title> — Tasks

## Status

pending

## Tasks

- [ ] 1. <Small vertical task>
- [ ] 2. <Small vertical task>

## Definition of Done

- [ ] Requirements are satisfied.
- [ ] Design constraints are followed.
- [ ] Tests/checks were run or explicitly documented as skipped.
- [ ] `specs/README.md` is updated.
- [ ] PR template references this spec.
```

## Quality bar

- Requirements must be testable.
- Design must name the harness layer that owns the change.
- Tasks must be small enough to review in a PR.
- Specs must not hide unknowns; document blockers and assumptions directly.
