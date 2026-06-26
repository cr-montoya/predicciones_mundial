# Design: Phase 5 - Polish

## Elements

- `DisclaimerBanner`.
- `LastUpdated`.
- `CaptureWrapper`.
- Animations with framer-motion in isolated client components.

## Decisions

- Keep animations as an enhancement, not a reading requirement.
- Disclaimer with a clear tone: entertainment, not advice.
- Capture mode reduces visual noise.

## Risks

- Animations affecting SSR/hydration.
- Disclaimer being too invasive.
