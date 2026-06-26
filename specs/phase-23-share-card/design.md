# phase-23-share-card — Design

## New Files

| File | Description |
|---|---|
| `app/og/fixture/[id]/route.tsx` | Edge route handler: generates PNG with `ImageResponse` |
| `components/share-button.tsx` | Client Component: share button with `navigator.share` |

## Modified Files

| File | Change |
|---|---|
| `app/fixtures/[id]/page.tsx` | Add `<meta og:image>` and `<ShareButton>` |

## Route Handler (`next/og`)

```ts
// app/og/fixture/[id]/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Load fixture + teams from static data
  // Compute result_1x2
  // Return ImageResponse with the card design
}
```

## OG Image Visual Design (1200×630)

```
┌─────────────────────────────────────────────────────────────┐
│  predicciones-mundial.vercel.app             [logo/text]    │
│                                                             │
│        Argentina           vs          France               │
│         🇦🇷                              🇫🇷                  │
│                                                             │
│    HOME   ████████████  62%                                 │
│    DRAW   ████         22%                                  │
│    AWAY   ███          16%                                  │
│                                                             │
│               This is how AI predicts the World Cup         │
└─────────────────────────────────────────────────────────────┘
```

- Background: `#0a0a0f` (same base as the app).
- Accent: `#FFDB00`.
- Typography: Inter or system — load from Google Fonts as ArrayBuffer.

## `ShareButton` (Client Component)

```ts
async function handleShare() {
  if (navigator.share) {
    await navigator.share({ title, text, url })
  } else {
    await navigator.clipboard.writeText(url)
    setFeedback('Copied!')
  }
}
```

## Meta Tags on Fixture Page

```html
<meta property="og:image" content="/og/fixture/[id]" />
<meta property="og:title" content="Argentina vs France — AI Prediction" />
<meta property="og:description" content="Home 62% · Draw 22% · Away 16%" />
```

## Security and Runtime

- Route handler in **Node.js runtime** (without `export const runtime = 'edge'`).
  Decision: edge runtime cannot use `fetch` with env vars or `loadFixtures()`.
  Node.js is consistent with the rest of the app and simpler.
- No secrets exposed to client — `FOOTBALLDATA_KEY` remains server-side.
- The image is public (no auth). Acceptable: it is entertainment content.

## Testing Strategy

- `GET /og/fixture/[id]` → response with `Content-Type: image/png` and status 200.
- `GET /og/fixture/9999` → 404 or generic error image.
- Manual: paste URL in WhatsApp Web → OG image visible.
- `pnpm build` verifies that the edge route compiles.
