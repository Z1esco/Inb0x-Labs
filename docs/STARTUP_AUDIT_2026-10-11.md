# Startup audit · 11 October 2026

## Repository baseline

- Actual workspace: `Downloads/Project AI/Inb0x Labs`; the brief's older `Downloads/Inb0x Labs` path does not exist.
- Original checkout: `develop` at `7043648`, with all tracked files deleted locally. Preserved without restore/reset/stash.
- Audit uses an isolated managed worktree based on PR #16 (`0722ac1`). Remote state fetched successfully.
- `main` is the initial commit `95e56fa`; it does not contain the application. `develop` contains the application and merged UI PRs #13 and #15.
- Only two open PRs: #16 (draft, mergeable, documentation) and #12 (draft, conflicting, older UI).
- `git merge-tree --write-tree origin/develop origin/feat/frontend-redesign` confirms 14 conflicting paths, including shared CSS, navigation, route views, and E2E tests. No actual merge was attempted. Preserve PR #12 as historical design evidence; port useful requirements individually to current `develop`, rather than replace the later implementation.
- PR #16 is the documentation dependency. Follow-up branches target its branch until founder-approved integration; no merges or history rewrites.
- Live GitHub inspection contradicts the unconnected-hosting assumption: PR #16 has a successful Vercel check and Preview deployment records. No preview environment/runtime was inspected. Pushing may deploy automatically, so pushes and draft PR publication are withheld pending explicit approval for that side effect.
- Other remote feature branches cover foundation, Gmail OAuth/sync, analysis, tasks, replies, settings, dashboard and earlier UI passes. They are historical work, not permission to reapply their diffs.

## Prioritized findings

| Priority | Finding and evidence                                                                                                                                                                      | Action                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Pinned Next.js 16.2.10 matches critical upstream advisories in the live npm audit, including Windows server RCE. This establishes an affected dependency, not application exploitability. | Update to a verified patched 16.x release before browser preview; run regression/build checks.                                                       |
| P0       | Current environment has no verified hosted credentials or provider connection. July security/rotation statements conflict with the founder's current unconnected status.                  | Treat historical reports as historical; require new hosted two-user, OAuth, deletion and rotation evidence before beta.                              |
| P1       | PR #16 baseline `npm run check` stops at five Prettier failures: README, CODEX_HANDOFF, DOMAIN_DEPLOYMENT, OWNERSHIP, STARTUP_ROADMAP.                                                    | Format only these documents and intentional additions/edits.                                                                                         |
| P1       | DESIGN_RULES and current instructions require dark-first; DESIGN_SYSTEM and CSS use paper-light colors. Sora is loaded but not used for display.                                          | Make DESIGN_RULES authoritative; adapt existing semantic surfaces and controls to a single dark workbench. Preserve domain components and contracts. |
| P1       | CI runs quality checks but has no browser job, dependency audit or secret scan.                                                                                                           | Add bounded synthetic demo browser coverage and security checks with least-privilege permissions.                                                    |
| P1       | Burst limiter uses a process-local Map; distributed instances do not share limits. Persisted atomic daily AI reservations exist separately.                                               | Production blocker; design a durable limiter using existing PostgreSQL before real-user traffic. Do not add infrastructure casually.                 |
| P2       | Root SECURITY and scoped AGENTS still describe a hackathon team/frontend partner. Root policy names main as the application support branch.                                               | Reconcile solo-founder support and review boundaries.                                                                                                |
| P2       | No changelog, beta legal decision register, or current release evidence index.                                                                                                            | Add concise factual documents; retain historical verification reports.                                                                               |

## Architecture and security inspection

Application routes compose domain views; the browser uses the typed API client. Thin authenticated API routes delegate to services/repositories, Zod validates inputs, and privileged queries explicitly scope ownership. Supabase migrations define RLS, browser grant restrictions and atomic daily AI reservations. No new backend abstraction is needed for presentation work.

Static review confirms separate app sign-in and Gmail authorization, fixed callback destinations, HTTP-only state cookies, user-bound expiring single-use OAuth state, encrypted tokens, inert email text rendering, explicit analysis/reply actions, explicit task acceptance, and copy-only replies. These observations do not certify hosted policy enforcement or Google consent behavior.

Account export is allowlisted and capped at 500 records per collection; it is not an unlimited archive. Account deletion calls Auth Admin for the authenticated user; active-session invalidation and provider revocation after deletion need dedicated-account verification. Retention is request-triggered, not a scheduled guaranteed purge. Missing explicit security headers and process-local demo state need release review. Demo mutations are shared per server process and reset on restart, so a public demo must contain fictional data only and must not promise isolated persistent workspaces.

The original `.superpowers/brainstorm/1270-1784380033/content/06-saas-system.html` specimen is absent in both available checkouts. No additional HTML specimens are tracked. Use the explicit approved brief and repository design rules; do not claim visual matching against an unavailable specimen.

## Reference review

Spenza's accessible repository README separates implemented capabilities, release status, provider limitations, development commands, security, ownership and changelog. Adopt that organization and factual standard only. Do not copy its product claims, contacts, records, licensing or architecture.

## Acceptance and sequencing

1. Documentation foundation: PR #16 follow-up, factual support/ownership, current audit, changelog, deployment/provider checklist, formatting and full baseline evidence.
2. Dependency/security follow-up: patched versions, safe headers and locally verifiable regressions, focused draft PR.
3. Dark workbench: shared token/typography/control foundation and route polish, unchanged APIs/schema/auth/AI behavior. Screenshot every route at 360, 390, 768, 1024, 1280, 1440 and 1920; test keyboard, reduced motion, demo workflow and overflow.
4. Beta readiness: record remaining hosted, legal, cost, Google verification and operational gates. No public deployment, DNS edits, purchases, migrations or merges without the founder's approval.

Fresh test outcomes are recorded in the phase delivery report. Historical PR test counts are not reused as current evidence.
