# CLAUDE.md — Mundial 2026 IA Predictor

## Qué es

App que proyecta mercados estadísticos del Mundial 2026 con un modelo propio. Framing:
"así predice la IA el Mundial". Es análisis de entretenimiento, no casa de apuestas:
solo muestra probabilidades, contexto y explicaciones; no recibe ni procesa apuestas.

## Stack vigente

- Next.js 16 App Router + React + TypeScript.
- Tailwind CSS.
- Vitest para tests.
- Vercel ISR en producción.
- `main` despliega producción en Vercel.
- PRs generan previews de Vercel.
- Fixtures en runtime server desde football-data.org mediante `FOOTBALLDATA_KEY`.
- API-Football/RapidAPI queda para endpoints enriquecidos como lineups, injuries, eventos, stats y fallback cuando aplique.
- Monte Carlo del torneo sigue precomputado en `lib/data/tournament-prediction.json`.
- SQLite/better-sqlite3 queda para scripts locales e historia del proyecto; no debe entrar al runtime de Vercel.

## Harness de capas

Las dependencias van en una sola dirección. Ninguna capa puede importar de la capa superior.

```txt
UI  <-  Agents  <-  Models  <-  Skills
      (I/O)       (math)      (pure fn)
```

### Contrato de Skill

- Función pura: `(input: T) => U`.
- Sin imports de `lib/db`, `lib/data`, providers, env vars, ni red.
- Sin `fetch`.
- Sin estado mutable global.
- Testeable en aislamiento con Vitest sin mocks complejos.

### Contrato de Model

- Recibe datos ya normalizados como argumentos.
- Nunca llama APIs externas.
- Nunca instancia DB.
- Devuelve `ModelOutput` o contratos derivados documentados por Analyst.
- Incluye sanity checks para probabilidades y rangos.

```ts
interface ModelOutput {
  market: MarketType
  probabilities: Record<string, number>
  confidence: 'high' | 'medium' | 'low'
  modelVersion: string
  computedAt: string
}
```

### Contrato de Agent

- Única capa autorizada para API externa, env vars server-side, cache runtime y scripts de datos.
- Puede llamar modelos con datos normalizados.
- Puede leer JSON precomputados si son fuente de verdad versionada.
- Debe degradar con fallback cuando una API no responda.
- Debe mantener API keys server-side; nunca `NEXT_PUBLIC_` para secrets.

### Contrato de UI

- Server Components por defecto.
- Client Components solo para interacciones pequeñas.
- Client Components no importan `lib/model`, `lib/db`, providers, ni env vars.
- La UI consume datos listos desde agents/server loaders.

## Agentes disponibles

Invocar con `Agent({ subagent_type: ... })` o dejar que Claude orqueste según la tarea:

- **analyst**: diseña contratos del modelo, valida matemáticas, probabilidades, lambdas, overround y copy técnico de mercados.
- **design**: define y revisa dirección visual, UX, responsive, microcopy visual, jerarquía y consistencia.
- **developer**: implementa siguiendo specs y harness.
- **qa**: escribe/corre tests, valida sanity checks, rutas principales y build.
- **code-quality**: revisa buenas prácticas de código, mantenibilidad, typing, simplicidad y duplicación.
- **reviewer**: audita capas, contratos, convenciones y consistencia spec-implementación.
- **security**: audita secrets, OWASP, CSP, runtime server, cuotas y exposición de APIs.

## Spec Driven Development

Toda fase o fix relevante debe tener spec antes o durante el PR:

```txt
specs/<nombre>/
  requirements.md
  design.md
  tasks.md
```

Estados usados:

- `pending`: todavía no implementado.
- `active`: en implementación.
- `completed`: cerrado.
- `historical`: decisión anterior conservada como contexto, no arquitectura vigente.

El PR debe enlazar su spec y marcar los acceptance criteria revisados.

Cuando se cree, renombre, cierre o cambie de estado una spec, actualizar siempre
`specs/README.md` en el mismo PR. Ese README es el índice vivo del roadmap SDD.

### Skills SDD

Usar estas skills para mantener el flujo spec-driven consistente:

- `.claude/skills/spec-init.md`: crear o normalizar specs y actualizar `specs/README.md`.
- `.claude/skills/spec-review.md`: revisar que la spec esté lista antes de implementar.
- `.claude/skills/data-contract.md`: definir contratos de datos para APIs, JSON, modelos, mercados, odds, lineups e ISR.
- `.claude/skills/adr.md`: documentar decisiones técnicas importantes en `docs/adr/`.
- `.claude/skills/task-runner.md`: implementar una task concreta sin salirse del alcance de la spec.
- `.claude/skills/spec-closeout.md`: cerrar una spec antes del PR.
- `.claude/skills/pr-prep.md`: preparar el cuerpo del PR desde la spec, diff, checks y gates.

Flujo recomendado:

1. `spec-init` cuando no exista spec o haya que normalizarla.
2. `spec-review` antes de pasar a implementación.
3. `data-contract` si cambian datos, APIs, modelos, mercados, odds, lineups o cache.
4. `adr` si se toma una decisión técnica con impacto de arquitectura.
5. `grill` antes de implementar si aplica.
6. Agentes pre-implementación cuando apliquen: Analyst, Design y Security.
7. `task-runner` para ejecutar una task acotada con Developer.
8. Agentes post-implementación: QA, Code Quality, Reviewer y los re-checks de Design/Security que apliquen.
9. `spec-closeout` cuando la implementación esté lista.
10. `grill` re-check si aplica.
11. `pr-prep` antes de abrir PR.
12. `commit` cuando haya cambios listos para commitear.

Los agentes no reemplazan las skills: las skills ordenan el proceso y los agentes
validan calidad desde su especialidad.

## Grill Gate

La skill `.claude/skills/grill.md` es obligatoria para fases, fixes de producto,
mercados nuevos, cambios de modelo, APIs externas y cambios de runtime.

Uso recomendado:

1. **Antes de implementar**: ejecutar Grill para detectar blockers de datos, contratos,
   harness, tests y riesgos.
2. **Antes de abrir PR**: hacer un Grill re-check corto para confirmar que los blockers
   quedaron resueltos o que los riesgos están documentados.

Si Grill termina con `DO NOT START`, no se debe pasar a Developer hasta resolver blockers
o actualizar la spec.

## Commit Gate

La skill `.claude/skills/commit.md` es obligatoria siempre que se vaya a crear un commit.
Todos los commits deben seguir Conventional Commits:

```txt
<type>(<scope>): <description>
```

Reglas clave:

- Mensaje en inglés.
- Una sola línea.
- Sin body, footer ni `Co-Authored-By`.
- Tipos permitidos: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`.
- Scope por capa/directorio cuando aplique: `model`, `ui`, `agents`, `specs`, `docs`, `security`, etc.
- La skill puede hacer `git add` y crear el commit. Debe inspeccionar `git status`/diff antes de stagear.
- Preferir `git add <files>`; `git add -A` solo si todos los cambios revisados pertenecen al mismo pedido.
- Nunca stagear secrets, archivos locales, caches o builds.

## Convenciones

- Implementar desde dentro hacia afuera: Skills -> Models -> Agents -> UI.
- No diseñar lógica estadística en Developer sin contrato de Analyst.
- No mezclar fases distintas en un mismo PR.
- No usar `npm` ni `yarn`; usar `pnpm`.
- Mantener secrets fuera del repo y del bundle cliente.
- Cuando cambien datos precomputados, explicar qué script se corrió y por qué cambió el JSON.
- Componentes sin estado deben ser server components.

## Diseño

La app es para contenido viral: no debe verse como template genérico. Norte visual:
terminal de datos deportiva/broadcast, datos al frente, números grandes, fondo oscuro,
acentos controlados, visualizaciones propias y lenguaje claro en español LATAM.

## Comandos

```bash
pnpm install
pnpm dev
pnpm test
pnpm tsc --noEmit
pnpm build
pnpm precompute
pnpm refresh-fixtures
```

## Verificación antes de cerrar una fase

1. Analyst aprobado, si cambia modelo, fórmula, probabilidades o copy técnico.
2. Design aprobado, si cambia UI/copy visual.
3. Grill report inicial sin blockers, o blockers resueltos en la spec.
4. `specs/README.md` actualizado si cambió una spec o su estado.
5. `pnpm tsc --noEmit`.
6. `pnpm test`.
7. `pnpm build`.
8. QA aprobado.
9. Code Quality sin bloqueantes.
10. Reviewer sin bloqueantes.
11. Security sin críticos.
12. Grill re-check antes del PR si hubo modelo/API/runtime/mercado nuevo.
13. Preview de Vercel revisado por owner si toca UI, rutas, runtime, ISR o datos.

Ninguna fase se da por terminada si un gate aplicable falla.

## Flujo Git y producción

`main` está conectado a producción en Vercel. No trabajar fases nuevas directamente sobre
`main`.

Flujo por defecto:

1. Actualizar `main` y crear rama corta: `phase/<numero>-<descripcion>` o `fix/<descripcion>`.
2. Usar `spec-init` si falta spec y actualizar `specs/README.md`.
3. Usar `spec-review` para validar que la spec está lista.
4. Usar `data-contract` si cambian datos, APIs, modelos, mercados, odds, lineups o cache.
5. Crear/actualizar ADR con `adr` si hay una decisión técnica relevante.
6. Ejecutar Grill antes de implementar cuando aplique.
7. Invocar agentes pre-implementación cuando apliquen:
   Analyst para modelo/probabilidades/copy técnico, Design para UI/UX/copy visual,
   Security para APIs/env vars/CSP/runtime/datos sensibles.
8. Implementar un scope pequeño y verificable con `task-runner` y Developer.
9. Correr gates post-implementación: QA, Code Quality, Reviewer y re-checks de Design/Security si aplican.
10. Hacer `spec-closeout` y Grill re-check antes del PR cuando aplique.
11. Preparar el PR con `pr-prep`.
12. Usar la skill Commit para crear commits estándar cuando haya cambios listos.
13. Abrir PR hacia `main` usando `.github/pull_request_template.md`.
14. Revisar preview deployment de Vercel.
15. Esperar aprobación humana del owner.
16. Merge a `main`.
17. Si producción falla, revertir PR o usar rollback de Vercel.

Reglas:

- `main` debe estar siempre desplegable.
- No hacer push directo a `main` para fases de producto.
- No mezclar fases distintas en el mismo PR.
- Dividir fases grandes en PRs verticales pequeños.
- Completar el template de PR antes de pedir review.

## Ciclo de corrección

1. **QA falla**: Developer corrige si es implementación; Analyst redefine si es lógica estadística.
2. **Design bloquea**: Developer ajusta UI/copy; QA valida que build/rutas no se rompan; Design re-valida.
3. **Code Quality bloquea**: Developer corrige deuda o mala práctica bloqueante; Code Quality re-valida.
4. **Reviewer bloquea**: Developer corrige violación del harness; Reviewer re-valida.
5. **Security reporta crítico**: Developer corrige; Security re-audita.
6. Cuando todos los gates aplicables dicen aprobado, la fase puede avanzar.
