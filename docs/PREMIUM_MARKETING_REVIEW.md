# Premium marketing review

## Implementation

The marketing website now has a contained sticky navbar, an asymmetric source-to-decision
hero, a separate full-width product chapter, stronger typography hierarchy, refined
evidence/reply/trust sections, a left-aligned conversion section and expanded footer.
Sora, Manrope and Space Grotesk remain the established font system; sizes, weights,
tracking and line lengths were retuned instead of changing the application typography.

New components: `HeroCorrespondence` (server-rendered illustrative composition),
`ReplyExample` (three local prewritten tones), and `MarketingMotion` (one observer and
cancelable Web Animations). Static content remains server-rendered. No new dependency,
API, contract, auth, dashboard, database, OAuth or environment change.

Product modes and source-to-action selection now have short content transitions.
Buttons and directory links have restrained hover/press feedback. The mobile menu
animates without moving the document, closes on outside pointer/Escape/navigation,
restores Escape focus, and makes closed links inert. Smooth anchor scrolling honors
reduced motion. Entrances play once and cancel if the preference changes; no timers,
scroll handlers, autoplay, animation library or provider request.

## Visual refinement

| Before                                                   | After                                                                                                    | Why                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Centered statement over a screenshot                     | Correspondence and its source-linked decision beside the statement; real screenshot gets its own chapter | Give Inb0x a product-specific signature and clearer reading order |
| Full-width flush header                                  | Contained sticky navigation with explicit demo action                                                    | Frame the page and strengthen conversion hierarchy                |
| Static reply excerpt                                     | Three selectable prewritten tones with copy-only disclosure                                              | Demonstrate tone control without implying a live AI call          |
| Instant mobile dropdown                                  | Opacity/translation entrance with immediate opening visibility and inert dismissal                       | Preserve keyboard access while adding continuity                  |
| “you.” alone at 360px in the first implementation pass   | Fluid 37–43px phone headline                                                                             | Remove the orphan and keep the product statement compact          |
| Mobile reassurance forced to 31ch                        | Natural available-width wrapping                                                                         | Avoid needless extra line breaks                                  |
| Broad header span selector also targeted the SVG wrapper | Caption selector excludes `.icon`                                                                        | Restore left alignment of the Reply Studio heading                |

Screenshots were inspected at desktop, tablet and phone sizes. The final capture script
also checks 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900 and 1920×1080.
Before images were captured from the untouched a588d78 build before implementation;
after images are captured from the updated local optimized build, with reduced motion
for stable comparisons. Interaction views show selected thread analysis, task suggestion,
Warm reply tone and the open mobile navigation.

## References and skill provenance

Primary: [Spenza](https://s-penza.app), visually inspected live in Brave, and its local
`landing/app` implementation (`hero`, `site-chrome`, `reveal`, page composition).
Used its contained navigation, asymmetric hierarchy, real product imagery, chapter
pacing and explicit mode controls. No Spenza assets, branding or product copy were used.

The eight master-prompt research sites were attempted: [Modulify](https://modulify.ai/templates),
[Iconly](https://iconly.design), [Font in Logo](https://fontinlogo.com),
[LogoToUse](https://logotouse.com), [Wonderlist](https://wonderlist.design),
[Landdding](https://landdding.com), [Motionin](https://motionin.design),
and [Wedoflow](https://wedoflow.com). Six returned readable research pages;
LogoToUse and Motionin could not be retrieved. Gallery/category research informed
composition, consistent icon treatment and typography discipline; no third-party
template, font, logo or asset was copied. See the plan for the principle-to-reference mapping.

Applied installed guidance: Brainstorming and Writing Plans (scoped design/plan),
Frontend Design (creative authority), Design Taste Frontend (anti-template critique),
UI/UX Pro Max (responsive/accessibility research via its search script), Emil Design
Engineering (motion/refinement), Systematic Debugging (menu timing investigation),
TDD (reply interaction regression), and Verification Before Completion.
UI Skills Root routed to Animation on Scroll, read through its CLI; the observer
principle was adapted to React with cleanup and no blur. Vercel React Best Practices
was read from the official repository and applied to server/client boundaries and
local state. No new skills were installed. Impeccable was not installed/available;
the visual critique here is a direct review, not an Impeccable execution claim.

## Verification status

Implementation commit: `626653083d61ff41ec48318a59921aa7c7c998a1`.
Branch: `codex/premium-marketing-experience`, directly descended from preserved `a588d78`.

| Verification                                        | Result                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run check`                                     | Passed: formatting, lint, TypeScript, 231 unit tests in 31 files, optimized build            |
| `npm run test:e2e`                                  | 34 passed across Chromium and WebKit; demo journeys and nine routes at seven viewport sizes  |
| Final marketing rerun after the last CSS refinement | 8 passed across Chromium and WebKit                                                          |
| Before/after capture script                         | Seven viewport sizes each; final captures have zero horizontal overflow and zero page errors |
| `npm run audit:production`                          | Zero production dependency vulnerabilities                                                   |
| `npm run security:scan` after staging source        | Zero findings across 248 tracked files                                                       |
| `git diff --check`                                  | Passed                                                                                       |

The first browser run caught a mobile visibility/focus timing defect and an outside-click
test target beneath the dropdown. Both were corrected. Two WebKit failures occurred during
an overlapping rebuild; neither recurred against the stable build. The isolated full rerun
passed all 34 checks. No application/backend changes were made to obtain that result.

Evidence: `docs/screenshots/premium-before` and `docs/screenshots/premium-after`.
The after directory includes `viewport-results.json`, selected product analysis,
walkthrough decision, Warm reply tone, and open mobile navigation captures.

Physical-device Safari, screen-reader testing and live provider/OAuth flows are outside
this marketing-only change and remain unverified. Desktop WebKit is not physical iOS.
No Production deployment, merge, DNS, Vercel Production Branch or environment changes.
