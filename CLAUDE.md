# CLAUDE.md — Mundial 2026 IA Predictor

## Qué es
App que proyecta TODOS los mercados estadísticos de cada partido del Mundial 2026 (resultado, goles, tarjetas, goleadores, corners) con un modelo propio. Framing: "así predice la IA el Mundial". Análisis de entretenimiento, NO casa de apuestas: solo muestra probabilidades, no recibe ni procesa apuestas.

## Stack
- Next.js 15 (App Router) + React + TypeScript
- Tailwind + shadcn/ui
- Recharts para visualizaciones
- SQLite (better-sqlite3) en archivo local (data/mundial.db) para cachear data
- Recálculo manual bajo demanda: script (pnpm refresh) o botón "Actualizar" en la UI (Server Action). Sin cron ni proceso 24/7.
- Fuente de datos: API-Football (RapidAPI). Fallback: football-data.org

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

### Agentes disponibles en este proyecto
Invocar con `Agent({ subagent_type: ... })` o dejar que Claude orqueste según la tarea:
- **analyst**: diseña contratos del modelo, valida la matemática estadística.
- **developer**: implementa código siguiendo los contratos del harness.
- **qa**: escribe y corre tests, valida sanity checks de outputs.
- **reviewer**: revisa consistencia entre capas y adherencia al harness.

## Convenciones
- Server Actions para fetch de data, no API routes sueltas. El refresh es un Server Action con guarda de frescura (no refresca si la última corrida fue hace menos de N minutos) para respetar la cuota de la API.
- Modelo de predicción aislado en lib/model/ (testeable, sin acoplar a UI).
- Toda predicción se guarda con timestamp para mostrar "histórico de predicciones".
- Nada de "--" (doble guion) en código ni texto.
- Componentes server por defecto; "use client" solo donde haya interactividad.

## Diseño
Esta app es para contenido viral: la UI no puede verse genérica de IA (Inter, gradientes morados, cards redondeadas flotando, Recharts default). Norte: look de terminal de datos deportiva (broadcast / Opta), números grandes como protagonista, fondo oscuro con un acento, visualizaciones custom. Comprométete con UNA dirección y no la sueltes entre pantallas.

## Correr en local
```bash
pnpm install
cp .env.example .env.local   # poner RAPIDAPI_KEY
pnpm dev                      # localhost:3000
pnpm refresh                  # trae data nueva y recalcula predicciones (o usa el botón "Actualizar" en la UI)
```
