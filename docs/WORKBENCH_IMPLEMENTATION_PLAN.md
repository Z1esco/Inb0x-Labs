# Dark attention workbench implementation plan

Approved source: founder's 11 October 2026 master brief and DESIGN_RULES.md. Execute inline, in focused dependency-aware branches. No further concept approval is needed for this direction; founder reviews draft PRs before integration.

## Goal and boundaries

Give the existing product a consistent dark premium attention workbench. Preserve the route tree, API client, schemas, providers, database, explicit analysis/task acceptance and copy-only drafts. Use native CSS and current SVG primitives; no new UI framework, animation library or fetching system.

## 1. Repository truth and baseline

- [x] Fetch remote state, inspect PRs #12/#16 and preserve the original deleted checkout.
- [x] Read root/scoped instructions, architecture, security, UI, motion and accessibility docs.
- [x] Confirm specimen unavailable and document conflict strategy.
- [x] Run baseline quality checks; record five formatting failures separately from passing application checks.
- [x] Commit documentation reconciliation after full `npm run check`; draft follow-up to PR #16.

## 2. Dependency/security maintenance

Files: package.json, package-lock.json, focused regression tests and security report; next.config.ts only for verified response-header hardening.

- [x] Confirm patched versions from live package metadata and upstream advisories. Keep Next/ESLint configuration aligned; avoid blind major upgrades or forced audit fixes.
- [x] Update affected direct dependencies and compatible transitive versions; review remaining advisory reachability and available fixes.
- [x] Verify existing tests/build and report remaining findings without claiming scanner output demonstrates exploitation.
- [x] Add locally testable protection against framing, MIME sniffing and referrer leakage; no untested strict CSP that breaks hydration or OAuth.
- [x] Commit focused security maintenance and prepare a separate draft PR.

## 3. Shared visual foundation and route presentation

Files: src/app/globals.css, docs/DESIGN_SYSTEM.md, docs/FRONTEND_IMPLEMENTATION_PLAN.md; domain components only for verified layout/accessibility defects.

- [x] Review historical PR #12 visual reference. No retained pre-change capture of current light source; specimen unavailable.
- [x] Replace paper-light values with semantic dark canvas/surface/text/rule/signal tokens. Preserve compatibility aliases temporarily where component selectors use them; remove hardcoded warm colors.
- [x] Use Sora display, Manrope UI and Space Grotesk metrics with system fallbacks. Keep editorial hierarchy, readable text, rectangular controls, restrained transitions and mobile bottom navigation.
- [x] Reconcile documentation to the actual horizontal desktop route index and mobile drawer rather than a nonexistent sidebar.
- [x] Review landing, login, dashboard, inbox, thread/evidence, Reply Studio, tasks, drafts, insights and settings with loaded fictional data. Preserve visible confidence/warnings and explicit actions.
- [x] Repair keyboard/focus and mobile defects found through browser checks. Use accessible behavior tests before behavior changes.

## 4. Candidate QA and release preparation

Files: tests/e2e, .github/workflows/ci.yml, scripts for bounded synthetic visual/security checks, docs/QA_2026-10-11.md, README and CHANGELOG.

- [x] Run `npm run check`, dependency audit and secret/content checks on final source.
- [x] Test all product routes at widths 360, 390, 768, 1024, 1280, 1440 and 1920. Capture real browser screenshots in an ignored output directory; inspect representative full-size captures and contact sheets.
- [x] Exercise demo navigation, explicit analysis, evidence, task acceptance, draft generation/copy, settings, errors and reset. Test reduced motion and keyboard focus.
- [x] Add a CI browser job with provider-free demo data and failure artifacts. CI configuration is not proof that hosted CI passed.
- [x] Record candidate SHA, exact checks/results, screenshots, security findings and remaining manual checks. Draft PRs remain unmerged.
- [x] Stop only external deployment/account/billing/DNS actions pending explicit approval. Keep provider/legal/retention/distributed-limiting gates clearly pending.

Acceptance: local checks and synthetic flows pass, visual evidence covers every requested width, no contracts/schema/provider behavior change, all remaining beta gates are explicit. Screen-reader/device/provider acceptance and production readiness remain separate evidence requirements.
