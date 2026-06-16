# Requirements: Fase 17 - Probabilidades implicitas de casas de apuestas

## Estado

Pendiente.

## Problema

El modelo propio genera probabilidades, pero el usuario no tiene contexto de mercado para
entender si la IA esta alineada o discrepa con las casas de apuestas. La comparacion
"modelo vs mercado" es un hook fuerte para contenido, siempre que se presente como
referencia informativa y no como recomendacion.

## Objetivo

Integrar probabilidades implicitas de bookmakers via The Odds API y mostrar, para mercados
MVP, el diferencial entre la probabilidad del modelo y la probabilidad implicita del
mercado.

## Requerimientos funcionales

1. Consumir odds desde The Odds API con API key server-side.
2. Normalizar odds decimales a probabilidades implicitas.
3. Ajustar overround para que cada mercado comparable sume 1.
4. Calcular diferencial modelo vs mercado.
5. Etiquetar diferencial como `VALOR+`, `VALOR-` o `NEUTRO`.
6. Mostrar odds/probabilidad implicita como referencia informativa en UI.
7. MVP limitado a:
   - 1X2.
   - Over/Under 2.5.
8. Mantener disclaimer de entretenimiento visible.

## Requerimientos no funcionales

1. La API key de The Odds API no debe llegar al browser.
2. Los calculos de valor deben vivir en skills puras.
3. El agent de odds debe estar separado de modelos/UI.
4. Debe respetarse la cuota free de 500 req/mes.
5. El sistema debe degradar si no hay odds disponibles para un partido.
6. No usar copy tipo "apuesta a", "seguro" o "garantizado".

## Criterios de exito

1. Odds implicitas suman aproximadamente 1 antes de ajuste y exactamente 1 despues.
2. Diferencial queda en rango [-1, 1].
3. UI muestra diferencial sin parecer recomendacion financiera.
4. `pnpm test` y `pnpm build` pasan.
5. Preview de Vercel aprobado por owner antes de merge.
