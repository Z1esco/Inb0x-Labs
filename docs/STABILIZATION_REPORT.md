# Inb0x Labs stabilization audit — 12 October 2026

Candidate branch: `codex/production-stabilization`, based on approved
`cda3eff200818fddc567c517f8161f5395246096`. That history preserves `a588d78`. Implementation commit: `1f8c92d85f7229b38f037389eacebca2a2d6656e`.
The original Downloads checkout and Spenza project were not changed. Production was
inspected with GET-only requests; no promotion, main push, hosted write or paid call occurred.

## Status matrix

| Area                                          | Status     | Evidence / limit                                                                                                                                         |
| --------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate frontend and fictional journeys     | PASS       | Seven release sizes; Chromium/WebKit; preserved premium styling and motion                                                                               |
| Backend contracts and provider mocks          | PASS       | 248 unit/integration tests, including ownership, validation, quotas, errors and new regressions                                                          |
| Build and dependency installation             | PASS       | Node 22.15.1 locally, engine 22.x; clean npm ci with install hooks disabled; format/lint/typecheck/build                                                 |
| Existing live Production                      | PARTIAL    | Eight GET page samples return 200, zero overflow; example thread reproduces React hydration error in both sizes; candidate fixes it                      |
| Supabase schema / grants                      | PASS       | Ten tables have RLS; six migrations match; browser grants read-only; credential tables not browser-accessible; quota RPCs server-only                    |
| Hosted two-user isolation / account lifecycle | NOT TESTED | No accounts or rows were created/changed; requires isolated provider testing and approval                                                                |
| Real Supabase identity sign-in                | BLOCKED    | Google provider enabled, but Site URL/allowlist point to old Preview/local callbacks; Production intentionally lacks provider credentials                |
| Real Gmail and OpenAI                         | BLOCKED    | Disabled in public demo; credentials, consent verification, model choice, budgets and explicit live-test authorization required                          |
| Security / dependency posture                 | PARTIAL    | Zero production dependency vulnerabilities; five dev-tool high advisories remain upstream; targeted CSP is not a strict nonce-based script policy        |
| Performance / accessibility                   | PARTIAL    | Lab CLS zero, no candidate page errors/overflow; keyboard/reduced motion/contrast checks pass; no field INP, physical iOS or screen-reader certification |
| GitHub / Vercel workflow                      | PARTIAL    | Safe candidate and draft main-recovery PR; main still incomplete/unprotected until owner approves protection and merge                                   |
| DNS / HTTPS                                   | PARTIAL    | HTTP and www redirect to HTTPS apex, HSTS present; MX targets the apex web host and mail delivery is not verified                                        |
| Release                                       | BLOCKED    | Explicit owner approval required; main merge triggers both Vercel Production and Supabase production synchronization                                     |

## Confirmed bugs and implemented corrections

| Severity / issue                                           | Root cause                                                                             | Fix and regression                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2: live example-thread hydration recovery                 | Absolute timestamp formatter inherited different server/browser timezones              | Explicit UTC, visible timezone annotation, consistent due-date calendar; timezone unit regression and New York/Tokyo browser tests                 |
| P2: recent-date hydration race                             | Relative labels used Date.now during SSR and first client render                       | Stable UTC calendar during hydration, relative text afterwards; delayed-hydration test reproduced 3m/5m mismatch before fix                        |
| P1 real-mode blocker: canonical Google scopes rejected     | Google returns userinfo.email/userinfo.profile while validation required short aliases | Normalize the two equivalent identity names before validation; acceptance regression                                                               |
| P1 real-mode boundary: extra Google permissions accepted   | Four-item denylist omitted gmail.labels/settings and unrelated scopes                  | Exact authorized scope allowlist; three additional denied-scope regressions plus existing forbidden-scope tests                                    |
| P2: identity callback can throw / contact Supabase in demo | Uncaught code exchange and no demo guard                                               | Fixed safe redirects, demo short circuit, rejection regression; provider detail never returned                                                     |
| P2: Gmail callback can enter provider code in demo         | Connect route guarded demo but callback did not                                        | Explicit 409 before state consumption or code exchange; regression confirms zero provider/state calls                                              |
| P2: Preview entry follows stale branch / localhost URL     | Shared Preview APP_URL names an old branch; missing value defaulted to localhost       | Demo redirect origin uses trusted current VERCEL_URL; real OAuth/Production explicit origins preserved; default Preview URL fallback tested        |
| P2: limiter retains unique identities indefinitely         | Map only expired entries when the same key returned                                    | Periodic expiry cleanup, 10,000-bucket cap, fail-closed overflow and recovery tests                                                                |
| P2: demo reset defeats its own rate limit                  | Reset cleared every bucket, including its reset counter                                | Preserve that counter while resetting other fictional fixture budgets; 30/minute reset cap and repeated-reset regression                           |
| P2: future Node major upgrades silently selected           | Open-ended >=20.9 engine despite CI using 22                                           | Pin 22.x in package/lock/.nvmrc and use that file in CI; no hosted setting changed                                                                 |
| P2: SEO gaps and Preview/private indexing                  | Missing robots/sitemap/canonical; private pages had no noindex metadata                | Marketing canonical/OG, marketing-only sitemap, private exclusions and noindex metadata; Preview-wide noindex header; unit and browser regressions |
| Defense in depth: missing CSP                              | No object/base/frame/form policy                                                       | Compatible directives added; full browser suite confirms no application breakage. Strict script/style nonces remain future work                    |

Eight regression assertions initially failed for scope/callback/limiter/header defects;
additional timezone, delayed hydration, Gmail demo callback and Preview fallback tests
also reproduced their failures before correction. The first full E2E run then found
two test-only canonical trailing-slash assertions; URL-normalized assertions fixed
those equivalent-URL comparisons. The clean full rerun passed all 38 checks.

## Test results

- `npm ci --ignore-scripts`: passed, 570 packages installed. Project .npmrc now applies
  that policy to default installs too. Build uses the installed optional native packages.
- `npm run check`: passed formatting, zero-warning lint, TypeScript, **248 tests in
  37 files**, and optimized Next.js 16.4 build.
- `npm run test:e2e`: **38 passed** across Chromium/WebKit; nine routes at seven sizes,
  complete demo flow, tasks, reply review/copy-only boundary, error recovery, keyboard
  navigation, reduced motion, privacy headers, SEO and cross-timezone hydration.
- `npm run audit:production`: passed, **zero vulnerabilities**.
- Full `npm audit`: **five high development-only findings**, not resolved. They trace to
  braces 3.0.3 through Next's ESLint dependency chain. Registry latest was also 3.0.3;
  npm proposes a breaking Next lint-config downgrade. No force fix/downgrade was applied.
- Credential scan and diff/format verification are rerun against staged candidate files.
- Read-only candidate smoke: eight 200 responses, **zero page errors, zero overflow**.
  Production baseline: example thread emits React #418 in both mobile/desktop samples.

The source tests use mocks/fictional data; they do not prove real consent, billing,
hosted session lifecycle, token revocation, deletion or provider availability.

## Performance and visual evidence

`scripts/verify-release-candidate.mjs` refuses real-mode targets, blocks browser mutation
requests, visits homepage/login/dashboard/example thread, saves screenshots, and records
navigation/LCP/CLS plus measurable resource sizes. These are **single lab samples**, not
field Web Vitals or a controlled remote-versus-local speed experiment.

- Production home lab LCP: 1,624ms mobile / 1,428ms desktop in the saved baseline;
  an earlier cold request measured 5,084ms. Network/cache variation is material.
- Candidate local home lab LCP: 936ms mobile / 812ms desktop. Do not interpret this
  local-versus-hosted difference as a measured optimization gain.
- Observed CLS: zero on all eight page/viewport samples for both hosts.
- Measurable improvement: bounded limiter memory and removal of reproduced hydration
  recovery, avoiding unnecessary React subtree regeneration. No speculative UI rewrite.
- Mobile screenshots are already small original assets (11–13KB); no unsupported claim
  of image-optimization savings or unnecessary font/design replacement was made.

Screenshots and JSON: `docs/screenshots/stabilization-production/` and
`docs/screenshots/stabilization-candidate/`. Candidate desktop dashboard and phone homepage
were visually inspected. The established palette, typography, hero, showcases, controls
and motion are preserved; time displays now explicitly use UTC where appropriate.

## Environment inventory — source of truth: src/lib/env.ts

No secret values were read or copied. Production has only DEMO_MODE and APP_URL configured
in the project environment; live health confirms demoMode=true with database/OpenAI/Google
OAuth unconfigured. APP_URL was verified as https://inb0x.my. Development has no project
variables. Local demo defaults remain credential-free. System environment access is enabled.

General Preview has DEMO_MODE=true and an APP_URL pointing to the obsolete
chore/production-readiness hostname. Only that old branch has branch-specific Supabase
credentials and a DEMO override. The candidate does not activate them or edit any variables.
The new redirect helper corrects candidate demo navigation independently of that stale value.

| Source variables                                                                   | Real-mode requirement / default                                                                |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| NEXT_PUBLIC_APP_URL                                                                | Production must be https://inb0x.my; local default localhost; blank Preview can use VERCEL_URL |
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | Required when DEMO_MODE=false; privileged key stays server-only                                |
| GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI                        | Required by separate real Gmail authorization; callback /api/gmail/callback                    |
| OAUTH_STATE_SECRET                                                                 | At least 32 characters; single-use state hashing                                               |
| TOKEN_ENCRYPTION_KEY                                                               | Base64 decoding to 32 bytes; AES-256-GCM                                                       |
| OPENAI_API_KEY, OPENAI_MODEL                                                       | Required only for real explicit analysis/reply generation                                      |
| OPENAI_REASONING_EFFORT                                                            | low; enum validated; model support must be checked before real use                             |
| OPENAI_TIMEOUT_MS, OPENAI_MAX_RETRIES                                              | 30,000ms / 1; bounded to 120,000ms and at most one retry                                       |
| DEMO_MODE                                                                          | true by default; remains true for public demo                                                  |
| ANALYSIS_DAILY_LIMIT, ANALYSIS_BATCH_LIMIT, REPLY_DAILY_LIMIT                      | 20 / 10 / 20; validated upper bounds                                                           |
| GMAIL_LOOKBACK_DAYS, GMAIL_MAX_THREADS                                             | 30 days / 50 threads; bounded                                                                  |
| THREAD_MAX_CHARACTERS, DATA_RETENTION_HOURS                                        | 12,000 / 24; validated bounds                                                                  |

## Hosted Supabase and provider readiness

The owner supplied project `dsohdhwjzsxuppjbynxs` (Inb0x-Labs), initially starting and
later ACTIVE_HEALTHY. Only this project was queried. SQL read metadata only; no user rows,
auth users, migrations or hosted settings were changed.

- Ten public tables have RLS and user-scoped policies. Browser grants are SELECT only
  for non-credential tables; gmail_connections and oauth_states have no browser grants.
- Both usage reservation RPCs are SECURITY DEFINER with empty search_path and execute
  granted only to service_role, not anon/authenticated.
- All six migration versions match the repository. Security Advisor returned no notices.
- Performance Advisor reported five unindexed foreign keys and eleven unused indexes,
  all informational. Do not remove indexes based on unused status in a pre-release database.
  Five proposed covering indexes are outside the migration directory and were not applied.
- Google identity provider is enabled, but Site URL and callback allowlist still refer
  to localhost and the old Preview. See RELEASE_RECOVERY.md for exact approved setup steps.
- Real two-user isolation, hosted sessions/export/deletion, Google consent/restricted scope
  verification, current key rotation and real OpenAI calls remain unverified.
- Burst limiting is still per-process; atomic daily quotas are separately database-backed.
  Distributed burst enforcement is a real-mode release gate requiring an approved design/migration.
- Retention cleanup runs on explicit Gmail sync. A strict wall-clock deletion SLA requires
  an approved scheduled cleanup mechanism; this candidate adds no hosted job.

## DNS, compliance and owner decisions

Read-only DNS: apex A 76.76.21.21, www CNAME to apex, MX preference 0 points to inb0x.my.
The MX target resolves to the web host; mail delivery is potentially misconfigured and
requires an actual mail provider's approved records. No SMTP probing or DNS edit was done.
HTTP and www return 308 to https://inb0x.my; HTTPS validates and HSTS is max-age=63072000.

[Vercel Hobby policy](https://vercel.com/docs/plans/hobby) limits Hobby to non-commercial
personal use. Treat the plan decision as a commercial release gate; no billing change was made.
The dev-only [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) is retained
as an explicit known risk until a compatible upstream fix or reviewed mitigation is available.

Owner approval is required for: applying main branch protection; merging the recovery PR
(Vercel plus Supabase production hooks); any promotion/rollback; billing/plan decisions;
MX/DNS corrections; production or OAuth environment changes; hosted auth URL corrections;
index migrations/distributed limiter/scheduled retention; and real-provider tests/activation.

No reproducible high-priority defect found in the bounded **candidate public-demo** audit
remains unfixed. This statement does not approve commercial launch or real integrations.
Release/rollback procedure and exact integration callbacks: `RELEASE_RECOVERY.md`.
