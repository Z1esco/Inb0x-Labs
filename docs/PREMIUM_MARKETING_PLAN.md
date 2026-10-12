# Premium marketing experience

## Direction and scope

Build on a588d78 on `codex/premium-marketing-experience`. Marketing only; auth,
dashboard, API contracts, provider behavior and production configuration stay intact.
The founder explicitly requested implementation now; no additional design approval gate.

Reading this as a premium email-productivity website for people managing decisions,
with an editorial correspondence language and a composed, interactive product stage.
Keep Sora display, Manrope body and Space Grotesk utility type. Canvas #080B10,
raised surface #121A26, text #F0F3FA, cyan #65D9E8, blue #6F9BFF, amber #F4B860.
Use a 1240px container, 24px mobile gutters, restrained borders and 8–16px radii.

Alternatives considered: retain the centered screenshot hero (too close to current);
full cinematic scroll sequence (unnecessary interaction cost); chosen asymmetric
correspondence hero plus full-width real screenshot stage and local demonstrations.
The signature is a source excerpt becoming a decision, with the evidence still visible.

## References actually inspected

- Spenza live site and local `landing/app` source: floating header, asymmetric hero,
  substantial product imagery, alternating story sections, interactive mode controls.
  Adapt composition and pacing; borrow no Spenza assets, copy or product functionality.
- Modulify template gallery: contrast varied compositions rather than repeated cards.
- Iconly: consistent icon-family discipline; retain Inb0x's shared stroke wrapper.
- Font in Logo: typography-led identity; retain established, locally hosted font families.
- Wonderlist and Landdding: independent section silhouettes and generous whitespace.
- Wedoflow: product-led navigation and purposeful conversion placement.
- logotouse.com and motionin.design could not be retrieved by the research tool.
  Do not claim their visual inspection. Spenza live inspection succeeded in Brave.

## Implementation and verification

- [x] Capture baseline desktop/tablet/mobile from the unchanged production build.
- [x] Add meaningful interaction regression tests before implementing new behavior.
- [x] Compose hero, product stage, reply-tone demo, refined chapter styling and footer.
- [x] Add small IntersectionObserver/WAAPI entrances, clean cancellation and reduced motion.
- [x] Animate mobile navigation with hidden/inert closed content and Escape focus return.
- [x] Run formatting, lint, TypeScript, unit tests, build, full Playwright journeys.
- [x] Inspect seven viewport captures; refine actual weaknesses and record evidence.
- [x] Prepare verified commits and evidence for a feature-branch-only Preview push.

No animation dependency, autoplay, scroll hijacking, automatic provider calls, fabricated
customers or metrics. Server-render static content; isolate interactive leaves.
The prior no-entrance-motion marketing rule is superseded only for this requested
marketing refinement. Reading surfaces and backend behavior remain untouched.
