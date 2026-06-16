# Requirements: Fase 15 — Español LATAM y glosario de mercados

## Problema

La app ya tiene una base visual fuerte, pero todavía hay textos mezclados, labels técnicos
o mercados que pueden ser confusos para una audiencia latinoamericana que no conoce todos
los términos de apuestas deportivas.

El objetivo no es convertir la app en casa de apuestas. La experiencia debe explicar
probabilidades como análisis estadístico de entretenimiento.

## Objetivo

Traducir y normalizar toda la experiencia a español latinoamericano, y agregar un glosario
de mercados con botones de info que expliquen qué significa cada mercado, cómo leer su
probabilidad y qué tan confiable es.

## Requerimientos funcionales

1. La UI visible debe estar en español latinoamericano.
2. Debe existir un diccionario tipado de mercados en `lib/content/markets-es.ts`.
3. Cada mercado visible debe tener:
   - Label corto.
   - Descripción clara.
   - Ejemplo de lectura.
   - Nota de confianza o limitación si aplica.
4. Las secciones de mercados deben incluir un botón/icono de info.
5. El botón de info debe abrir tooltip, popover o panel compacto sin romper mobile.
6. El disclaimer de entretenimiento debe estar visible en páginas de mercados o predicciones.
7. Fechas, horas y porcentajes deben usar formato regional consistente (`es-CO` o `es-419`).
8. Los estados vacíos y errores deben ser claros, cortos y en español.

## Requerimientos no funcionales

1. No duplicar strings de mercados en múltiples componentes.
2. Mantener componentes server por defecto; usar client components pequeños solo para interacción.
3. No exponer secrets ni mover lógica de providers al cliente.
4. Mantener el look broadcast definido en Fase 14.
5. No usar lenguaje de promesa financiera ni recomendación de apuesta.
6. Mantener Vercel ISR y no romper `revalidate`.

## Criterios de éxito

1. No quedan strings críticos de UI en inglés.
2. Todos los mercados visibles están cubiertos por el glosario.
3. Los botones de info funcionan en desktop y mobile.
4. `pnpm test` y `pnpm build` pasan.
5. Preview de Vercel aprobado por owner antes de merge.
