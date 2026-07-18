# Frontend implementation plan

## Current state

The App Router has a complete, demo-safe product route structure with a shared `AppNav`, skip link,
page primitives, deterministic mock data, and typed browser API client. The global stylesheet already
provides the dark control-room surface treatment, responsive breakpoints, reduced-motion handling, and
the Sora, Manrope, and Space Grotesk font roles. Phase 1 centralizes the semantic token vocabulary and
completes the shell controls without changing API or provider behavior.

## Reusable foundation

- `AppNav` owns the desktop sidebar, responsive mobile navigation, contextual top bar, and user controls.
- `SkipLink`, `PageShell`, `Surface`, `MetricCard`, `EmptyState`, and `ErrorState` provide shared
  structure and accessible states.
- `Icon` is the single inline SVG icon system.
- `src/lib/api-client.ts`, `src/types/contracts.ts`, and `src/mock` are the stable data boundary; views
  must not introduce parallel response types or scattered browser fetches.

## Figma inventory

The approved product file covers the landing page, sign-in, dashboard, inbox, thread detail, reply
studio, tasks, insights, settings, mobile dashboard, and analysis loading state. The connector currently
requires an in-app selection before visual extraction; implementation continues from the repository's
approved dark-first design authority until node context is available.

## Token plan

`src/app/globals.css` is the token source of truth. It exposes semantic background, text, border, signal,
status, spacing, radius, and shadow variables, then maps the visual subset into Tailwind v4 theme names.
The palette deliberately has no green-family tokens: cyan communicates connected and safe states. Existing
6/10/16px control and panel radii remain because they are the repository design authority; larger values
are reserved for cinematic scenes.

## Responsive and motion strategy

The primary desktop shell is a 248px sidebar plus a dense fluid content area. At 820px the sidebar becomes
a keyboard-operable drawer and the mobile navigation stays above page content. Pages target 360px through
1920px, retaining essential navigation and actions. CSS transitions use opacity and transforms in the
120–360ms system range; reduced motion removes movement and continuous shimmer.

## Accessibility strategy

The shell supplies a skip link, labelled navigation landmarks, visible focus states, route state via
`aria-current`, labelled icon controls, and an accessible user menu trigger. Mobile navigation remains
keyboard reachable and the page-level main landmark remains owned by `PageShell`.

## Data integration strategy

Phase 1 does not add data loading or provider actions. “Analyze inbox” leads users to the explicit inbox
workflow rather than triggering analysis from layout render. Gmail stays read-only and reply actions remain
copy-only. Future domain screens consume typed APIs or deterministic demo fixtures through the existing
client boundary.

## Testing and performance

Frontend changes receive targeted tests where behavior is added, then format, lint, typecheck, unit,
build, and Playwright checks. The shell avoids a second UI, chart, or animation dependency, keeps the
client boundary limited to navigation interactions, and uses CSS rather than heavyweight effects.

## Implementation phases

1. **Foundation:** document the architecture, centralize semantic tokens, and complete the responsive shell.
2. **Marketing and auth:** refine the cinematic landing and consent-first login views.
3. **Dashboard:** add focus, sequence, health, category, activity, and accessible data states.
4. **Inbox and thread:** deliver priority triage, safe plain-text thread reading, evidence, and actions.
5. **Drafts and tasks:** add copy-only reply controls and explicit task workflows.
6. **Insights and settings:** add accessible analysis displays and privacy-focused settings.
7. **Quality pass:** validate responsive layouts, keyboard flow, reduced motion, performance, and security
   deny-list scans.

## Expected frontend files

- `src/app/globals.css`
- `src/components/app-nav.tsx`
- `src/components/page-primitives.tsx`
- `src/components/*-view.tsx`
- `src/app/(marketing)/**`, `src/app/(auth)/**`, and `src/app/(dashboard)/**`
- frontend unit and Playwright tests

Backend contracts, migrations, server services, Gmail scopes, and provider configuration remain out of
scope unless separately coordinated.
