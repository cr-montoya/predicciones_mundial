# phase-22-mis-picks — Design

## Ruta

`app/mis-picks/page.tsx` — layout Server Component + inner Client Component que
lee localStorage.

## Arquitectura

```
app/mis-picks/page.tsx  (Server Component)
  ↓ loadFixtures() → pasa fixtures como prop
  → <MisPicksClient fixtures={fixtures} />  (Client Component)
      ↓ lee localStorage: pick_${id} para cada fixture
      → agrupa en: pendientes / en curso / resueltos
      → renderiza secciones + contador
```

Pasar los fixtures desde el servidor evita una llamada extra desde el cliente y
mantiene el API key server-side.

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `app/mis-picks/page.tsx` | Shell Server Component |
| `components/mis-picks-client.tsx` | Client Component con lógica de localStorage |
| `components/pick-result-row.tsx` | Fila individual de pick con veredicto |

## Diseño visual

### Contador
```
┌──────────────────────────────────────┐
│  MIS PICKS                           │
│  7 acertados / 10 resueltos  → 70%  │
│  ████████████████░░░░░░              │
└──────────────────────────────────────┘
```

### Fila de pick resuelto
```
Argentina vs France  ·  2-1
Mi pick: Local  →  ✓ ACERTASTE
```

### Estado vacío
```
Aún no tienes picks guardados.
[ Ver partidos → ]
```

## Reutilización

`resolveModelVerdict` de `lib/skills/accuracy.ts` (phase-20) puede reutilizarse
para el veredicto, pero el veredicto del pick del usuario es `resolveVerdict` de
`lib/skills/picks.ts` (phase-19). Son funciones distintas — una para el modelo,
otra para el usuario.

## Security and Runtime

- Sin secrets en Client Component. Los fixtures se pasan como props desde el
  Server Component padre — el API key nunca llega al cliente.
- localStorage no es cifrado; los picks son datos de entretenimiento, sin PII.

## Testing Strategy

- Hidratación: renderizar con SSR → sin mismatch (null server-side, montar client-side).
- Estado vacío: sin picks en localStorage → CTA visible.
- Veredictos: picks resueltos con resultado correcto/incorrecto → veredicto correcto.
- Contador: `7/10 = 70%` debe ser exacto.
