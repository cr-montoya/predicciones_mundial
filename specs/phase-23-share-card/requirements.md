---
status: completed
phase: 23
owner: cristian
branch: phase/23-share-card
pr: 15
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: pending
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-23-share-card — Requirements

## Status

pending

## Objective

Allow sharing a match prediction as an image on social media and chat groups.
This is the most direct virality vector: "the AI says Argentina 65%, I'm sending this
to the group chat".

## Context

The app already has rich predictions for each match. Today the only sharing vector
is copying the URL. A visual card with teams, probabilities, and app branding is
shareable directly to WhatsApp, Instagram Stories, Twitter/X.

Next.js supports dynamic OG images via `next/og` (`ImageResponse`) in route
handlers. This generates a server-side PNG without canvas on the client and without
heavy dependencies.

## Scope

- Route handler `app/og/fixture/[id]/route.tsx` that generates a PNG image with:
  - Team names and flag emojis.
  - Model probabilities for `result_1x2` (home / draw / away) with bars.
  - Branding: app name + logo/text.
  - Dark background, gold accent, broadcast typography.
- OG meta tags in `app/fixtures/[id]/page.tsx` pointing to the generated image.
- "Share prediction" button on the fixture page that:
  - On devices with `navigator.share`: calls the native sharing API with URL + text.
  - On desktop: copies the URL to the clipboard with visual feedback.

## Out of Scope

- Tournament card (champion / Golden Boot).
- Personal user pick card.
- Direct image download as a file.
- Support for all markets; only `result_1x2` in this phase.

## Requirements

1. `GET /og/fixture/[id]` returns a valid PNG image with match probabilities.
2. The image has at minimum: team names, 1X2 percentages, app name.
3. `app/fixtures/[id]/page.tsx` includes `<meta property="og:image">` pointing to
   the route handler URL.
4. The fixture page shows a "Share" button that uses `navigator.share` or copies the URL.
5. The route handler does not expose API keys or sensitive data.

## Acceptance Criteria

- [ ] `GET /og/fixture/[id]` returns `Content-Type: image/png` with a valid image.
- [ ] Sharing from mobile opens the native share sheet.
- [ ] Sharing from desktop copies the URL with "Copied!" feedback.
- [ ] OG image displays correctly when pasting the URL in WhatsApp or Twitter.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm build` passes (the route handler compiles without errors on edge runtime).

## Risks and Assumptions

- `next/og` uses edge runtime. Custom fonts must be loaded as `ArrayBuffer`
  from the filesystem or a URL, not from `node_modules`. Must verify that the font
  used by the app is available in the edge.
- Flag emojis may not render the same on all systems in the OG renderer context.
  If there are issues, replace with the country name in text.
- WhatsApp will scrape the URL to get the OG image; requires the route to be
  public (no auth). Confirmed: the app has no per-route auth.
