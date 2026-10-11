# Spenza-inspired product experience · 12 October 2026

The V2 brief is the approved scope. Execute inline using the Superpowers planning,
test-first behavior checks and verification workflow. Existing DESIGN_RULES.md remains
the visual authority; this plan extends its composition without replacing its palette.

## Direction and alternatives

Retain the attention desk and make the product tangible. A centered statement followed
by a wide, actual interface capture gives the web application room to breathe. A source
quote, a grounded finding and an explicit next action form the signature interaction.
Keep Sora display, Manrope reading copy and Space Grotesk for actual data. Canvas
#080b10, surface #0c1119, raised #121a26, text #f0f3fa, cyan #65d9e8 and blue #6f9bff
retain the current implementation; red and amber retain urgency and warning semantics.

Compared alternatives: retaining the two-column brief would leave the product invisible;
floating dashboard fragments would obscure reading and repeat the SaaS-card template.
Use one wide product stage, an asymmetric evidence chapter, a reply reading surface,
then a concise insights chapter. Do not copy Spenza's phone, violet palette or assets.

```text
Brand                 Product / Method / Privacy         Demo / Sign in
                    Make room for what needs you.
                          Demo + product anchor
           [ Briefing | Thread analysis | Reply Studio ]
           [ actual Inb0x interface, fictional workspace ]
Problem statement        Source -> evidence -> your decision (selectable)
Grounded understanding   readable excerpt + uncertain-date explanation
Reply review surface     tone / length / facts explanation
Insights story           working route directory + explainable data
Read-only trust ledger   FAQ
Final demo / sign-in     brand + real route and project links
```

Self-review: removed edition numbers, decorative section labels and unverified
product metrics. Product images are our own actual UI captures, explicitly fictional.
Interactive examples are educational, do not impersonate the connected workspace,
and never call an API. Actual tasks and replies remain in the application.

## Implementation and checks

- [x] Capture baseline and inspect all existing product routes and source.
- [x] Add failing browser tests for product selection, evidence walkthrough,
      mobile disclosure keyboard behavior and absence of provider requests.
- [x] Add failing render tests for data-driven dashboard text, including empty
      and singular queues. Preserve API contracts and fixtures.
- [x] Implement marketing Server Component composition with small client islands
      for navigation, product selection and the source walkthrough. Reuse Icon,
      Next Image, existing tokens, buttons and route destinations. Add no dependency.
- [x] Add a scoped marketing stylesheet; preserve shared legacy login styles. Use a 1240px
      marketing container, 24px mobile inset, 48–112px section rhythm, 8px controls
      and 14px media surfaces. Use current app geometry for operational screens.
- [x] Review actual rendered desktop and mobile views using Impeccable critique,
      then fix verified issues. Respect reduced motion and visible default content.
- [x] Test exact 360x800, 390x844, 768x1024, 1024x768, 1280x800, 1440x900,
      1920x1080 sizes in Chromium and WebKit, all nine existing routes, console
      errors, overflow, critical journeys and keyboard behavior.
- [x] Run npm run check, npm run test:e2e, production audit and tracked-secret scan.
      Record actual commands/results and commit on main. No new PR, per the latest instruction.

## Coordination and dependencies

Active PRs inspected on 12 October: #12 and #16–20. The founder answered the coordination
question explicitly: solo developer, main only, no separate branches. This instruction
supersedes the V2 brief's two-developer and draft-PR workflow. Local main starts at the
previous #20 candidate, preserving all prior history and security fixes; origin/main is
its ancestor. No force push or history rewrite is necessary. Older remote branches and
draft PRs are retained as history. No new PR is created. Global workflow documents are
reconciled with the founder's latest instruction. APIs, contracts, mocks, route layouts,
backend and RLS remain unchanged. Publishing main is pending separate Production approval.

## Research actually performed

- Spenza live https://s-penza.app: Chromium desktop 1440x900 and mobile 390x844,
  navigated and scrolled through product chapters; hero and full-page captures retained
  in ignored test-results/v2-research. Web search could not access it; the real browser
  returned 200. Hero presents product behavior, chapter layouts vary, recurring container
  alignment joins scenes, trust and FAQ precede a final CTA. Adopt structure and pacing.
- Source https://github.com/Z1esco/Spenza-Spending-Tracker: authenticated GitHub API
  verified landing/app/page.tsx SHA 23958141fad64ffb7bcb9e77f3a2fbef7b1a82cc.
  Read local landing page, hero, chrome and CSS read-only; that checkout has unrelated
  edits. Its 1240px container and semantic tokens inform our independently written CSS.
- https://landdding.com: actual browser gallery inspected. The Direct Design thumbnail
  pairs a large statement with an asymmetric artifact; use an email excerpt as the artifact,
  without copying traffic-light imagery, branding or a complete layout.
- https://motionin.design: actual browser reached www.motionin.design (200). Kinetic
  heading and large section examples demonstrate emphasis but reduce reading stability.
  Adopt interaction-triggered change; decline looping headline motion for email reading.

## Skill provenance and use

Installed task-local copies in the Windows temporary directory using the reviewed
Codex skill installer: official anthropics/skills frontend-design; vercel-labs/agent-skills
react-best-practices, composition-patterns, web-design-guidelines; pbakaus/impeccable
.agents/skills/impeccable. Repositories are non-archived and exact SKILL.md paths verified.
No project hooks, global settings, submodules or application packages installed. The
Impeccable Windows launcher was reviewed and its context command ran successfully;
its checksum-verified engine cache is task-local. These temporary copies are read directly
in this session and are not registered as persistent skills for future chats.

Anthropic controls creative decisions. UI/UX Pro Max search was executed: its generic
waitlist/glass/Inter recommendations conflict with the brief and were rejected; its
accessibility and responsive heuristics remain useful. Existing Taste supports critique;
its exact upstream identity is unverified, so no claimed upstream install. Emil guidance
informs short feedback transitions. Vercel guides server/client boundaries and event-based
interaction. Superpowers supplies planning, test-first behavior and verification. Impeccable
supplies the independent final visual review. Record actual final review results separately.

Skip ambiguous overlapping skill collections, BMAD, new UI libraries, Stitch and Figma:
no integration or approved editable design is necessary for this source implementation.
No Supabase changes are in scope; preserve the previously reviewed backend boundaries.
