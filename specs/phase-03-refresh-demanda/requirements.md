# Requirements: Fase 3 - Refresh bajo demanda

## Estado

Completada historicamente. Parte del flujo fue sustituido luego por Vercel ISR para fixtures.

## Objetivo

Permitir actualizar datos y predicciones manualmente sin proceso 24/7.

## Requerimientos

1. Debe existir script `pnpm refresh`.
2. El refresh debe traer fixtures/resultados nuevos.
3. El refresh debe recalcular predicciones.
4. Debe existir guarda de frescura para proteger cuota de API.
5. No debe existir scheduler obligatorio.

## Criterios de éxito

1. El refresh corre localmente.
2. La cuota API queda protegida.
3. La logica reusable queda en agents/scripts, no en UI.
