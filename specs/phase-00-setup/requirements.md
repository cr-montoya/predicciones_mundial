# Requirements: Fase 0 - Setup

## Estado

Completada.

## Objetivo

Crear la base técnica del proyecto con Next.js, TypeScript, Tailwind, estructura de capas y herramientas de prueba.

## Requerimientos

1. La app debe usar Next.js App Router con TypeScript.
2. Debe existir estructura base `app/`, `lib/data/`, `lib/model/`, `lib/db/` y `scripts/`.
3. Debe existir soporte local para SQLite con DB gitignored.
4. Debe existir configuración de estilos con Tailwind.
5. Debe existir tooling de tests con Vitest.
6. Debe existir plantilla de variables de entorno para API keys.

## Criterios de éxito

1. `pnpm dev` levanta la app local.
2. `pnpm test` corre Vitest.
3. La estructura permite separar UI, agents, models y skills.
