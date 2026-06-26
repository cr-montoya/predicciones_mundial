# phase-23-share-card — Tasks

## Status

pending

## Tasks

### Pre-implementation
- [ ] 1. `spec-review`.
- [ ] 2. Design: approve visual layout of OG image (colors, typography, composition).
- [ ] 3. Verify that `next/og` + edge runtime is compatible with the current Next.js version.
- [ ] 4. Grill: detect blockers for edge runtime and fonts.

### Implementation
- [ ] 5. Create `app/og/fixture/[id]/route.tsx` with `ImageResponse`.
- [ ] 6. Test the generated image locally at `/og/fixture/[id]`.
- [ ] 7. Create `components/share-button.tsx` with `navigator.share` / clipboard fallback.
- [ ] 8. Add OG meta tags in `app/fixtures/[id]/page.tsx`.
- [ ] 9. Integrate `<ShareButton>` on the fixture page.

### Verification
- [ ] 10. `pnpm tsc --noEmit` and `pnpm build`.
- [ ] 11. QA: test sharing on mobile (native sheet) and desktop (clipboard).
- [ ] 12. QA: paste URL in WhatsApp Web — verify OG image appears.
- [ ] 13. Code Quality and Reviewer.

### Closeout
- [ ] 14. `spec-closeout` and PR.

## Definition of Done

- [ ] `GET /og/fixture/[id]` returns a valid PNG image.
- [ ] OG image visible when sharing URL on WhatsApp/Twitter.
- [ ] Share button works on mobile and desktop.
- [ ] `pnpm build` passes with edge runtime.
- [ ] Vercel preview reviewed.
