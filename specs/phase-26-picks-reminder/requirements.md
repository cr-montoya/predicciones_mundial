---
status: blocked
phase: 26
owner: cristian
branch: phase/26-picks-reminder
pr:
preview:
gates:
  spec_review: pending
  grill: pending
  analyst: not_applicable
  design: pending
  data_contract: not_applicable
  security: not_applicable
  qa: pending
  code_quality: pending
  reviewer: pending
---

# phase-26-picks-reminder — Requirements

## Status

blocked — depende de phase-19 (picks en localStorage)

## Objective

Mostrar un recordatorio in-app cuando hay partidos que empiezan pronto y el usuario
no tiene pick registrado. Aumenta el engagement con la feature de picks sin
necesitar notificaciones push ni permisos del navegador.

## Contexto

Phase-19 permite hacer picks antes de cada partido. El problema es que el usuario
puede olvidar hacer su pick si no entra a la página del fixture específico. Un
banner/badge discreto en la home o en el nav que diga "Hay 2 partidos hoy sin
pick" es suficiente para recordarlo sin ser intrusivo.

**Depende de phase-19** (picks en localStorage).

## Scope

- Banner `<PicksReminderBanner>` en la home (`app/page.tsx`) que aparece cuando:
  - Hay partidos con `status === 'scheduled'` cuyo `kickoffUtc` es en las próximas
    6 horas.
  - El usuario no tiene un pick guardado en localStorage para esos partidos.
- El banner muestra cuántos partidos están próximos sin pick y un link a `/fixtures`.
- El banner se puede cerrar (dismiss) — se guarda en localStorage que fue cerrado
  para ese día para no volver a mostrarse.
- Badge numérico en el nav link de Fixtures si hay partidos próximos sin pick.
- Es Client Component (necesita localStorage y reloj del cliente).

## Out of Scope

- Push notifications del navegador (requieren permiso explícito).
- Recordatorio por email o SMS.
- Recordatorio para partidos de más de 6 horas en el futuro.
- Sonido o vibración.

## Requirements

1. El banner aparece en la home cuando hay ≥1 partido scheduled en las próximas
   6 horas sin pick del usuario.
2. El banner muestra el número de partidos próximos sin pick.
3. El banner tiene un botón de cierre que lo oculta hasta el día siguiente.
4. El nav link de Fixtures muestra un badge con el conteo cuando aplica.
5. Si no hay partidos próximos sin pick, banner y badge no se renderizan.
6. No genera flash de contenido en SSR (hidratación segura con `useEffect`).

## Acceptance Criteria

- [ ] Banner visible en home cuando hay partido en próximas 6h sin pick.
- [ ] Banner no aparece si el usuario ya tiene picks para todos los partidos próximos.
- [ ] Botón de cierre oculta el banner y persiste el dismiss hasta el día siguiente.
- [ ] Badge en nav muestra conteo correcto.
- [ ] Sin flash de contenido (hydration mismatch) en SSR.
- [ ] `pnpm tsc --noEmit` pasa.

## Risks and Assumptions

- **Depende de phase-19**: sin picks en localStorage, el banner siempre mostraría
  todos los partidos próximos como "sin pick". Se debe implementar después o en
  paralelo con phase-19.
- El reloj del cliente puede diferir del horario de kickoff del servidor. La
  ventana de 6 horas es suficientemente amplia para absorber desfases de zona
  horaria razonables.
- "Dismiss hasta el día siguiente" se implementa guardando en localStorage la fecha
  del último dismiss (`picks_reminder_dismissed: '2026-06-16'`).
