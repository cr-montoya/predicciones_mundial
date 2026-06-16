# Claude Harness

Este directorio contiene la configuración operativa de agentes para trabajar con el
proyecto Mundial 2026 IA Predictor.

## Fuente de verdad

- `../CLAUDE.md`: reglas globales del proyecto, harness de capas, flujo Git y gates.
- `../plan.md`: roadmap por fases.
- `../specs/`: specs SDD por fase o fix.
- `../.github/pull_request_template.md`: checklist obligatorio para PRs.

## Agentes

| Agente | Archivo | Cuándo usarlo |
| --- | --- | --- |
| Analyst | `agents/analyst.md` | Modelos, probabilidades, lambdas, odds, overround, lineups, copy técnico. |
| Design | `agents/design.md` | UI, responsive, microcopy visual, jerarquía, estados vacíos, modo captura. |
| Developer | `agents/developer.md` | Implementación de código según spec y harness. |
| QA | `agents/qa.md` | Tests, type-check, build, sanity checks, smoke de rutas. |
| Code Quality | `agents/code-quality.md` | Buenas prácticas, mantenibilidad, typing, simplicidad y duplicación. |
| Reviewer | `agents/reviewer.md` | Auditoría de capas, contratos, spec vs implementación. |
| Security | `agents/security.md` | Secrets, CSP, APIs externas, OWASP, runtime Vercel. |

## Flujo recomendado por fase

1. Usar `skills/spec-init.md` si falta spec o hay que normalizarla.
2. Leer la spec en `specs/<fase>/`.
3. Actualizar `specs/README.md` si la spec es nueva, cambió de nombre o cambió de estado.
4. Usar `skills/spec-review.md` antes de implementar.
5. Usar `skills/data-contract.md` si hay APIs, JSON, modelos, mercados, odds, lineups, ISR o server loaders.
6. Usar `skills/adr.md` si hay una decisión técnica con impacto de arquitectura.
7. Ejecutar `skills/grill.md` antes de implementar si hay fase, fix de producto, mercado, modelo, API externa o runtime.
8. Invocar agentes pre-implementación cuando apliquen:
   Analyst para modelo/probabilidades/copy técnico, Design para UI/UX/copy visual,
   Security para APIs/env vars/CSP/runtime/datos sensibles.
9. Developer implementa con `skills/task-runner.md` cuando el trabajo venga de una spec.
10. QA corre/verifica tests y rutas.
11. Code Quality revisa buenas prácticas y mantenibilidad.
12. Reviewer audita harness.
13. Design re-valida si hubo UI.
14. Security re-audita si hubo APIs, env vars, CSP, runtime o datos sensibles.
15. Otros agentes especialistas re-validan si bloquearon o pidieron cambios.
16. Usar `skills/spec-closeout.md` antes del PR.
17. Ejecutar Grill re-check antes del PR cuando aplique.
18. Usar `skills/pr-prep.md` para preparar el cuerpo del PR.
19. Usar `skills/commit.md` para crear commits estándar cuando haya cambios listos.
20. Owner revisa preview de Vercel.
21. Merge a `main` solo con aprobación.

## Skills

| Skill | Archivo | Cuándo usarla |
| --- | --- | --- |
| Spec Init | `skills/spec-init.md` | Crear/normalizar specs y mantener `specs/README.md`. |
| Spec Review | `skills/spec-review.md` | Validar que una spec esté lista antes de implementar. |
| Data Contract | `skills/data-contract.md` | Definir contratos de APIs, JSON, modelos, mercados, odds, lineups e ISR. |
| ADR | `skills/adr.md` | Documentar decisiones técnicas relevantes. |
| Grill | `skills/grill.md` | Detectar blockers antes de construir y antes del PR. |
| Task Runner | `skills/task-runner.md` | Implementar una task acotada desde una spec. |
| Spec Closeout | `skills/spec-closeout.md` | Cerrar una spec antes del PR. |
| PR Prep | `skills/pr-prep.md` | Preparar PR desde spec, diff, checks y gates. |
| Commit | `skills/commit.md` | Stagear cambios relevantes y crear commits estándar. |

## Producción

Producción vive en Vercel y despliega desde `main`. No se hacen pushes directos a `main`
para fases de producto. Todo cambio relevante debe ir por rama corta, PR, template completo
y preview de Vercel.

## Notas

- Las referencias a Cloudflare/D1 son históricas salvo que una spec nueva indique lo contrario.
- `scripts/` puede contener herramientas históricas o locales; no asumir que todo script aplica al runtime vigente.
- `skills/grill.md` no reemplaza Analyst/Reviewer; sirve para detectar blockers antes de construir y antes del PR.
- `skills/commit.md` es obligatorio para commits: Conventional Commit en inglés, una sola línea, sin co-author, y el agente puede hacer `git add` tras revisar status/diff.
- `skills/spec-init.md`, `skills/spec-closeout.md` y cualquier cambio de estado de specs deben mantener `specs/README.md` actualizado.
- `skills/pr-prep.md` no reemplaza la revisión humana del preview de Vercel; solo deja el PR listo y honesto.
- Si una instrucción de agente contradice `CLAUDE.md`, prevalece `CLAUDE.md`.
