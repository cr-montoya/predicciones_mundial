# Requirements: Fase 18 - Datos de jugadores enriquecidos

## Estado

Pendiente.

## Problema

Los mercados de goleadores tienen confianza baja porque usan tasas historicas sin saber si
el jugador sera titular, suplente, lesionado o suspendido. La distribucion cambia mucho
cuando hay alineaciones confirmadas.

## Objetivo

Incorporar lineups confirmados y datos de lesiones/suspensiones para mejorar la confianza
de los mercados de goleadores, sin exponer API keys al cliente y sin romper Vercel ISR.

## Requerimientos funcionales

1. Obtener lineups desde API-Football cuando el partido este cerca del kickoff.
2. Obtener lesiones/suspensiones cuando la fuente lo permita.
3. Guardar/cachear lineups por `fixtureId`.
4. Pasar lineup opcional al modelo de goleadores.
5. Si hay lineup confirmado, filtrar titulares y usar `starterProbability = 1.0`.
6. Si no hay lineup, usar fallback historico con `starterProbability` estimada.
7. Si un jugador esta lesionado/suspendido, bajar o anular su probabilidad.
8. Mostrar en UI si la alineacion esta confirmada y timestamp.

## Requerimientos no funcionales

1. API-Football solo debe llamarse desde server/agents.
2. Client components no importan providers ni env vars.
3. El mercado de goleadores debe degradar sin bloquear la pagina.
4. Debe respetarse cuota de API.
5. La confianza debe reflejar calidad de datos.
6. Manual refresh/Server Action near-kickoff debe estar protegido.

## Criterios de exito

1. Con lineup confirmado, goleadores usan solo titulares confirmados.
2. Sin lineup, la UI muestra confianza baja o datos limitados.
3. Con lesion/suspension, jugador afectado no aparece como pick fuerte.
4. Tests cubren lineup completo, sin lineup y jugador lesionado.
5. `pnpm test` y `pnpm build` pasan.
6. Preview de Vercel aprobado por owner antes de merge.
