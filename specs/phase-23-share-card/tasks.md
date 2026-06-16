# phase-23-share-card — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`.
- [ ] 2. Design: aprobar layout visual de la OG image (colores, tipografía, composición).
- [ ] 3. Verificar que `next/og` + edge runtime es compatible con la versión de Next.js en uso.
- [ ] 4. Grill: detectar blockers de edge runtime y fonts.

### Implementación
- [ ] 5. Crear `app/og/fixture/[id]/route.tsx` con `ImageResponse`.
- [ ] 6. Probar la imagen generada localmente en `/og/fixture/[id]`.
- [ ] 7. Crear `components/share-button.tsx` con `navigator.share` / clipboard fallback.
- [ ] 8. Agregar meta tags OG en `app/fixtures/[id]/page.tsx`.
- [ ] 9. Integrar `<ShareButton>` en la página de fixture.

### Verificación
- [ ] 10. `pnpm tsc --noEmit` y `pnpm build`.
- [ ] 11. QA: probar compartir en móvil (sheet nativo) y desktop (clipboard).
- [ ] 12. QA: pegar URL en WhatsApp Web — verificar que aparece la OG image.
- [ ] 13. Code Quality y Reviewer.

### Cierre
- [ ] 14. `spec-closeout` y PR.

## Definition of Done

- [ ] `GET /og/fixture/[id]` devuelve imagen PNG válida.
- [ ] OG image visible al compartir URL en WhatsApp/Twitter.
- [ ] Botón compartir funciona en móvil y desktop.
- [ ] `pnpm build` pasa con edge runtime.
- [ ] Preview de Vercel revisado.
