# CLAUDE.md — Mundial 2026 IA Predictor

## Qué es
App que proyecta TODOS los mercados estadísticos de cada partido del Mundial 2026 (resultado, goles, tarjetas, goleadores, corners) con un modelo propio. Framing: "así predice la IA el Mundial". Análisis de entretenimiento, NO casa de apuestas: solo muestra probabilidades, no recibe ni procesa apuestas.

## Stack
- Next.js 15 (App Router) + React + TypeScript
- Tailwind + shadcn/ui
- Recharts para visualizaciones
- SQLite vía **Cloudflare D1** (serverless, no filesystem) para cachear data. Local: mejor-sqlite3 en desarrollo.
- Recálculo manual bajo demanda: script (pnpm refresh) o botón "Actualizar" en la UI (Server Action). Sin cron ni proceso 24/7. En Cloudflare: Cron Trigger o manual via dashboard.
- Fuente de datos: API-Football (RapidAPI). Fallback: football-data.org
- Deploy: **Cloudflare Pages** (free tier amplio, compatible con Next.js)

## Harness de capas

Las dependencias van en una sola dirección. Ninguna capa puede importar de la capa superior.

```
UI  <-  Agents  <-  Models  <-  Skills
(DB)   (I/O)      (DB->out)   (pure fn)
```

### Contrato de Skill
- Función pura: `(input: T) => U`. Sin imports de DB, API, ni red.
- Sin estado mutable. Testeable en aislamiento con vitest sin mocks.

### Contrato de Model
- Recibe data ya normalizada de DB (nunca respuesta cruda de API).
- Devuelve siempre `ModelOutput`:
  ```ts
  interface ModelOutput {
    market: MarketType
    probabilities: Record<string, number>  // suman 1.0 ± 0.001
    confidence: 'high' | 'medium' | 'low'
    modelVersion: string
    computedAt: string  // ISO 8601
  }
  ```
- Incluye `sanityCheck(output)` que lanza si las probabilidades no suman 1.0.

### Contrato de Agent
- Solo agents (scripts/refresh.ts y el Server Action) pueden llamar a la API externa o escribir en DB.
- Todo agent registra en DB un `run_log` con timestamp, duración y resultado (ok / error).
- El Server Action de refresh verifica la guarda de frescura antes de correr.
- **En Cloudflare D1**: agents acceden a DB vía `d1.prepare()` (Wrangler) en lugar de `better-sqlite3` directo. Bindings configurados en `wrangler.toml`.
- Secretos (`RAPIDAPI_KEY`, etc.) via `wrangler secret` (no en código ni .env en Cloudflare).

### Agentes disponibles en este proyecto
Invocar con `Agent({ subagent_type: ... })` o dejar que Claude orqueste según la tarea:
- **analyst**: diseña contratos del modelo, valida la matemática estadística.
- **design**: define dirección visual, UX, responsive, microcopy visual y consistencia de componentes antes y después de cambios de UI.
- **developer**: implementa código siguiendo los contratos del harness.
- **qa**: escribe y corre tests, valida sanity checks de outputs.
- **reviewer**: revisa consistencia entre capas y adherencia al harness.
- **security**: auditoría de código, detección de vulnerabilidades OWASP, exposure de secretos, buenas prácticas.

## Convenciones
- Server Actions para fetch de data, no API routes sueltas. El refresh es un Server Action con guarda de frescura (no refresca si la última corrida fue hace menos de N minutos) para respetar la cuota de la API.
- Modelo de predicción aislado en lib/model/ (testeable, sin acoplar a UI).
- Toda predicción se guarda con timestamp para mostrar "histórico de predicciones".
- Nada de "--" (doble guion) en código ni texto.
- Componentes server por defecto; "use client" solo donde haya interactividad.

## Diseño
Esta app es para contenido viral: la UI no puede verse genérica de IA (Inter, gradientes morados, cards redondeadas flotando, Recharts default). Norte: look de terminal de datos deportiva (broadcast / Opta), números grandes como protagonista, fondo oscuro con un acento, visualizaciones custom. Comprométete con UNA dirección y no la sueltes entre pantallas.

## Comandos

```bash
pnpm install
cp .env.example .env.local   # poner RAPIDAPI_KEY
pnpm dev                      # localhost:3000
pnpm refresh                  # trae data nueva y recalcula predicciones (o usa el botón "Actualizar" en la UI)
pnpm test                     # corre vitest
pnpm tsc --noEmit             # type-check sin compilar
pnpm lint                     # ESLint
pnpm build                    # build de producción (usar para confirmar que no hay errores antes de cerrar una fase)
```

## Verificación antes de cerrar cualquier fase

Secuencia obligatoria en este orden:

1. Agente **design** — obligatorio si hubo cambios de UI/copy visual; sin bloqueantes visuales.
2. `pnpm tsc --noEmit` — cero errores de tipos.
3. `pnpm test` — todos los tests pasan.
4. Agente **reviewer** — sin bloqueantes en el checklist.
5. Agente **security** — sin vulnerabilidades críticas (bloqueantes); altos y informativos pueden ir a siguientes releases.

Ninguna fase se da por terminada si design aplica y reporta bloqueantes, si type-check/tests fallan, si reviewer reporta bloqueantes, o si security reporta CRÍTICO.
Antes de deploy a Cloudflare: security check es obligatorio.

## Flujo Git y producción

`main` está conectado a producción en Cloudflare Pages. No trabajar fases nuevas directamente sobre `main` salvo documentación menor autorizada explícitamente.

Flujo por defecto:

1. Actualizar `main` y crear una rama corta desde ahí: `phase/<numero>-<descripcion>` o `fix/<descripcion>`.
2. Implementar un scope pequeño y verificable.
3. Correr los gates aplicables: design/analyst, type-check, tests, build, reviewer y security.
4. Abrir PR hacia `main` usando `.github/pull_request_template.md`, con resumen, riesgos, comandos ejecutados y screenshots si hubo UI.
5. Usar el preview deployment de Cloudflare para revisión funcional.
6. Esperar aprobación humana del owner antes de mergear.
7. Merge a `main` despliega producción; si falla, revertir el PR o usar rollback de Cloudflare.

Reglas:
- `main` debe estar siempre desplegable.
- No hacer push directo a `main` para fases de producto.
- No mezclar fases distintas en el mismo PR.
- Dividir fases grandes en PRs verticales pequeños.
- Si un cambio modifica datos precomputados, explicar qué scripts se corrieron y por qué cambió el JSON.
- Completar el template de PR antes de pedir revisión del owner.

## Ciclo de corrección

Cuando un agente reporta un fallo:

1. **QA reporta test failure**: 
   - Si es **implementación** (bug): developer corrige, QA re-corre.
   - Si es **lógica estadística**: analyst redefine, developer reimplementa, QA valida.

2. **Reviewer reporta bloqueante**:
   - Developer arregla violación del harness, reviewer re-valida.

3. **Design reporta bloqueante**:
   - Developer ajusta UI/CSS/copy, QA valida que no rompió build/rutas, design re-valida.

4. **Security reporta CRÍTICO**:
   - Developer arregla vulnerabilidad, security re-audita.

5. Una vez aprobados todos los gates aplicables (QA + Design si aplica + Reviewer + Security): la fase avanza.

El loop no se cierra hasta que todos digan `APROBADO`.

Nota: Before merge/deploy to Cloudflare, siempre security check es requerido, incluso si la fase anterior lo pasó.
