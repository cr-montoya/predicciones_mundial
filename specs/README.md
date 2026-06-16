# Specs

Este directorio guarda las specs del proyecto en formato SDD. Cada fase o fix relevante
debe tener una carpeta con tres archivos:

```txt
specs/<nombre>/
  requirements.md
  design.md
  tasks.md
```

## Estados

- `pending`: todavía no implementado.
- `active`: en implementación.
- `completed`: cerrado y validado.
- `historical`: se conserva como memoria de decisiones, pero no representa arquitectura vigente.

## Cómo usar una spec

1. Leer `requirements.md` para entender problema, objetivo y criterios de éxito.
2. Leer `design.md` para entender arquitectura, contratos, riesgos y decisiones.
3. Ejecutar `tasks.md` como checklist por agente.
4. Enlazar la spec en el PR.
5. Copiar o resumir los acceptance criteria en el PR template.
6. Actualizar estado/tareas si el alcance cambia durante la implementación.
7. Actualizar este README si se crea, renombra, cierra o cambia de estado una spec.

## Índice de fases

| Fase | Spec | Estado |
| --- | --- | --- |
| 0 | `phase-00-setup` | completed |
| 1 | `phase-01-ingesta-db` | completed |
| 2 | `phase-02-modelo-prediccion` | completed |
| 3 | `phase-03-refresh-demanda` | completed / historical parcial |
| 4 | `phase-04-dashboard` | completed |
| 5 | `phase-05-pulido` | completed |
| 6 | `phase-06-diseno-broadcast` | completed |
| 7 | `phase-07-branding-world-cup` | completed |
| 8 | `phase-08-datos-historicos` | completed |
| 9 | `phase-09-cloudflare-d1` | historical |
| 10 | `phase-10-hardening-auth` | completed |
| 11 | `phase-11-deploy-vercel-isr` | completed |
| 12 | `phase-12-datos-historicos-enriquecidos` | completed |
| 13 | `phase-13-predicciones-fixture-cards` | completed |
| 14 | `phase-14-sistema-visual-design` | completed |
| 15 | `phase-15-espanol-glosario` | completed |
| 16 | `phase-16-goleadores-mercados` | completed |
| 17 | `phase-17-odds-implicitas` | pending |
| 18 | `phase-18-jugadores-lineups` | pending |

## Specs de infraestructura/fixes

| Spec | Uso |
| --- | --- |
| `auto-refresh-workers` | Exploración histórica de Cloudflare Workers/next-on-pages. |
| `vercel-env-csp` | Diagnóstico y fixes de env vars/CSP en Vercel. |

## Reglas

- No implementar una fase nueva sin spec enlazada.
- No usar una spec histórica como guía vigente sin crear una nueva spec de reactivación.
- Si el PR se desvía de la spec, actualizar la spec o explicar el cambio en el PR.
- Si cambia el estado de una spec, actualizar este README en el mismo PR.
- Si se agrega una fase/spec nueva, agregarla al índice en este README antes de pedir review.
- Las specs no reemplazan tests ni review; son contrato de intención y aceptación.
