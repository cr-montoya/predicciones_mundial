# phase-23-share-card — Design

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `app/og/fixture/[id]/route.tsx` | Route handler edge: genera PNG con `ImageResponse` |
| `components/share-button.tsx` | Client Component: botón compartir con `navigator.share` |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/fixtures/[id]/page.tsx` | Agregar `<meta og:image>` y `<ShareButton>` |

## Route handler (`next/og`)

```ts
// app/og/fixture/[id]/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Cargar fixture + teams desde los datos estáticos
  // Computar result_1x2
  // Retornar ImageResponse con el diseño de la card
}
```

## Diseño visual de la OG image (1200×630)

```
┌─────────────────────────────────────────────────────────────┐
│  predicciones-mundial.vercel.app             [logo/texto]   │
│                                                             │
│        Argentina           vs          France               │
│         🇦🇷                              🇫🇷                  │
│                                                             │
│    LOCAL  ████████████  62%                                 │
│    EMPATE ████         22%                                  │
│    VISITA ███          16%                                  │
│                                                             │
│               Así predice la IA el Mundial                  │
└─────────────────────────────────────────────────────────────┘
```

- Fondo: `#0a0a0f` (misma base que la app).
- Acento: `#FFDB00`.
- Tipografía: Inter o sistema — cargar desde Google Fonts como ArrayBuffer.

## `ShareButton` (Client Component)

```ts
async function handleShare() {
  if (navigator.share) {
    await navigator.share({ title, text, url })
  } else {
    await navigator.clipboard.writeText(url)
    setFeedback('¡Copiado!')
  }
}
```

## Meta tags en fixture page

```html
<meta property="og:image" content="/og/fixture/[id]" />
<meta property="og:title" content="Argentina vs France — Predicción IA" />
<meta property="og:description" content="Local 62% · Empate 22% · Visita 16%" />
```

## Security and Runtime

- Route handler en **Node.js runtime** (sin `export const runtime = 'edge'`).
  Decisión: edge runtime no puede usar `fetch` con env vars ni `loadFixtures()`.
  Node.js es consistente con el resto de la app y más simple.
- Sin secrets expuestos al cliente — `FOOTBALLDATA_KEY` permanece server-side.
- La imagen es pública (sin auth). Aceptable: es contenido de entretenimiento.

## Testing Strategy

- `GET /og/fixture/[id]` → response con `Content-Type: image/png` y status 200.
- `GET /og/fixture/9999` → 404 o imagen de error genérica.
- Manual: pegar URL en WhatsApp Web → OG image visible.
- `pnpm build` verifica que el edge route compila.
