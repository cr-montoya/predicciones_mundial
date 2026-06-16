---
status: pending
phase: 23
owner: cristian
branch: phase/23-share-card
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

# phase-23-share-card — Requirements

## Status

pending

## Objective

Permitir compartir la predicción de un partido como imagen en redes sociales y
grupos de chat. Es el vector de viralidad más directo: "la IA dice Argentina 65%,
le mando esto al grupo".

## Contexto

La app ya tiene predicciones ricas para cada partido. Hoy el único vector de
compartir es copiar la URL. Una card visual con equipos, probabilidades y branding
de la app es compartible directamente a WhatsApp, Instagram Stories, Twitter/X.

Next.js soporta OG images dinámicas via `next/og` (`ImageResponse`) en route
handlers. Esto genera una imagen PNG server-side sin canvas en el cliente y sin
dependencias pesadas.

## Scope

- Route handler `app/og/fixture/[id]/route.tsx` que genera una imagen PNG con:
  - Nombre de los equipos y banderas emoji.
  - Probabilidades del modelo para `result_1x2` (home / draw / away) con barras.
  - Branding: nombre de la app + logo/texto.
  - Fondo oscuro, acento dorado, tipografía broadcast.
- Meta tags OG en `app/fixtures/[id]/page.tsx` apuntando a la imagen generada.
- Botón "Compartir predicción" en la página de fixture que:
  - En dispositivos con `navigator.share`: llama la API nativa de compartir con
    URL + texto.
  - En desktop: copia la URL al portapapeles con feedback visual.

## Out of Scope

- Card de tournament (campeón / bota de oro).
- Card de pick personal del usuario.
- Descarga directa de la imagen como archivo.
- Soporte para todos los mercados; solo `result_1x2` en esta fase.

## Requirements

1. `GET /og/fixture/[id]` devuelve una imagen PNG válida con las probabilidades
   del partido.
2. La imagen tiene al menos: nombres de equipos, porcentajes 1X2, nombre de la app.
3. `app/fixtures/[id]/page.tsx` incluye `<meta property="og:image">` apuntando a
   la URL del route handler.
4. La página de fixture muestra un botón "Compartir" que usa `navigator.share` o
   copia la URL.
5. El route handler no expone API keys ni datos sensibles.

## Acceptance Criteria

- [ ] `GET /og/fixture/[id]` devuelve `Content-Type: image/png` con una imagen válida.
- [ ] Compartir desde móvil abre el sheet nativo de compartir.
- [ ] Compartir desde desktop copia la URL con feedback "¡Copiado!".
- [ ] OG image se ve correctamente al pegar la URL en WhatsApp o Twitter.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm build` pasa (el route handler compila sin errores en el edge runtime).

## Risks and Assumptions

- `next/og` usa edge runtime. Los fonts custom deben cargarse como `ArrayBuffer`
  desde el sistema de archivos o una URL, no desde `node_modules`. Se debe
  verificar que la fuente que usa la app esté disponible en el edge.
- Los emoji de banderas pueden no renderizar igual en todos los sistemas en el
  contexto del OG renderer. Si hay problemas se reemplaza con el nombre del país
  en texto.
- WhatsApp scrapeará la URL para obtener la OG image; requiere que la ruta sea
  pública (sin auth). Confirmado: la app no tiene auth por ruta.
