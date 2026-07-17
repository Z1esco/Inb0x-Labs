# Release verification — 2026-07-17

Release candidate: PR #10 (`chore/production-readiness`) after PR #11 was merged at
`157ca3b882e8080cacd83b46bffae5259fccd75c`.

Status meanings:

- **Passed**: verified by an automated or read-only runtime check in this release pass.
- **Failed**: a release requirement is currently not satisfied.
- **Manually verified**: checked interactively against the named environment.
- **Requires credentials**: needs a dedicated provider test account or an undisclosed credential.
- **Blocked**: cannot be completed safely until an earlier requirement is resolved.

No provider secret, token, email content, prompt, or draft is recorded here.

## Pre-deployment checklist

| Requirement                                                                          | Status                   | Evidence or next action                                                                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Rotate every previously exposed Supabase privileged secret and revoke the old value  | **Blocked**              | Rotation cannot be proven from the repository or CLI. Rotate in Supabase before any privileged hosted operation.                          |
| Confirm local environment files, `.vercel/`, OAuth downloads, and logs are untracked | **Passed**               | Ignore rules and tracked-file scan passed; `.env.local` is untracked.                                                                     |
| Configure production variables and keep server secrets non-public                    | **Blocked**              | Preview was inspected and contains only `DEMO_MODE` plus `NEXT_PUBLIC_APP_URL`; Production is not configured.                             |
| Run install, full checks, E2E, and dependency audit                                  | **Passed**               | Install, 222 unit/integration tests, production build, 2 Playwright tests, and audit passed.                                              |
| Run secret, Gmail-write, dangerous-HTML, no-green, and pillbox scans                 | **Passed**               | Relevant matches were reviewed; no runtime Gmail write call, secret exposure, raw HTML rendering, green UI, or textual pillbox was found. |
| Link the intended Supabase project and inspect migrations                            | **Passed**               | Project `dsohdhwjzsxuppjbynxs` is linked and healthy; remote migration history was inspected.                                             |
| Apply migrations in filename order                                                   | **Failed**               | Hosted project has migrations 1–2 only. Reply drafts, settings, and server-table hardening migrations are missing.                        |
| Run linked database lint and Advisors                                                | **Blocked**              | Both returned no issues, but only against the incomplete hosted schema. Repeat after applying all migrations.                             |
| Confirm RLS and revoke browser mutation grants on server-managed tables              | **Failed**               | RLS is enabled, but the missing hardening migration leaves excessive authenticated mutation grants.                                       |
| Run two-user isolation checks                                                        | **Blocked**              | Requires the complete hosted schema, rotated server secret, and two disposable users.                                                     |
| Set the Supabase production Site URL                                                 | **Blocked**              | No production domain or Vercel deployment exists.                                                                                         |
| Add the production auth callback allowlist entry                                     | **Blocked**              | No production domain exists.                                                                                                              |
| Configure the Supabase Google provider callback                                      | **Requires credentials** | Must be verified in Google Cloud and Supabase using a dedicated test account.                                                             |
| Enable Gmail API and configure a dedicated Gmail OAuth client                        | **Requires credentials** | Configuration was not inspected live in this pass.                                                                                        |
| Register the production Gmail callback URI                                           | **Blocked**              | No production domain exists.                                                                                                              |
| Confirm the four allowed Google scopes only                                          | **Passed**               | Static scope assertions and deny-list tests passed; live consent verification still requires credentials.                                 |
| Configure OpenAI budget, model, key, and limits                                      | **Blocked**              | Demo mode intentionally has no OpenAI key/model.                                                                                          |
| Import the repository into Vercel and configure its runtime                          | **Passed**               | The Vercel integration built commit `e071917`; the GitHub deployment check passed. Production runtime configuration remains pending.      |
| Deploy and inspect a Vercel Preview                                                  | **Passed**               | An authenticated protection-bypass smoke test verified the landing, login, dashboard, health, demo reset, and safe demo API responses.    |

## Post-deployment checklist

| Requirement                                                                    | Status                   | Evidence or next action                                                                                                        |
| ------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Landing page and logo load over HTTPS without console errors                   | **Blocked**              | HTTPS returned 200 with brand, logo, and font assets and no server error; a browser-console/hydration pass remains.            |
| Credential-free demo opens and resets deterministically without provider calls | **Passed**               | Hosted health, dashboard, Gmail status, and reset APIs confirmed deterministic demo mode with no provider calls.               |
| Supabase Google sign-in and protected callback session                         | **Requires credentials** | Needs a deployed callback and disposable Google account.                                                                       |
| Signed-out dashboard redirect and logout                                       | **Passed**               | Automated auth and middleware tests passed; repeat in Preview.                                                                 |
| Gmail connect shows dedicated read-only consent                                | **Requires credentials** | Needs deployed Gmail OAuth and a disposable Gmail account.                                                                     |
| Gmail status excludes tokens, encrypted payloads, and internal IDs             | **Passed**               | Contract, service, and integration tests passed.                                                                               |
| Explicit sync remains recent, read-only, and attachment-metadata-only          | **Passed**               | Gmail sync unit/integration tests and write-operation scan passed; live provider test remains pending.                         |
| Thread list/search/detail expose normalized plain text only                    | **Passed**               | Parser, service, route, and dangerous-HTML tests passed.                                                                       |
| Explicit analysis, caching, and quota behavior                                 | **Passed**               | Deterministic demo and mocked OpenAI tests passed; real OpenAI is blocked.                                                     |
| Evidence grounding and prompt-injection inertness                              | **Passed**               | Structured-output and prompt-injection fixtures passed.                                                                        |
| Task create/accept/deduplicate/edit/complete/reopen/delete                     | **Passed**               | Task unit, integration, and demo tests passed.                                                                                 |
| Reply Studio creates copy-only drafts and no Send control                      | **Passed**               | Reply tests and UI/security scans passed.                                                                                      |
| Dashboard loads without automatic Gmail/OpenAI mutations                       | **Passed**               | The hosted dashboard returned 200 and its API reported `demoMode=true` and `externalCalls=false`.                              |
| Settings persist without sync or analysis side effects                         | **Passed**               | Settings service, route, and demo tests passed.                                                                                |
| Gmail disconnect cleans up local credentials after revocation failure          | **Passed**               | Mocked integration coverage passed; live provider test requires credentials.                                                   |
| Account export excludes secrets and deletion removes owned data                | **Passed**               | Account integration tests passed against the local schema.                                                                     |
| Safe errors contain stable codes and request IDs                               | **Passed**               | API error mapping tests passed.                                                                                                |
| Inspect hosted logs for sensitive content                                      | **Passed**               | The nine smoke-test log entries contained request metadata only; no error/warning entry or sensitive application log appeared. |
| Smoke-test all seven viewports                                                 | **Passed**               | Playwright viewport regression coverage passed locally; HTTPS Preview remains pending.                                         |
| Keyboard, focus, labels, mobile navigation, and reduced motion                 | **Passed**               | Automated UI coverage and the PR #11 polish review passed; a final deployed assistive-technology pass remains pending.         |

## Two-user isolation checklist

All two-user cases are **Blocked** until secret rotation is confirmed and the three missing hosted
migrations are applied. This includes Gmail/OAuth state, threads, analyses, tasks, reply drafts,
dashboard/usage, profile/settings/export, safe not-found behavior, and concurrent quota isolation.

The local PostgreSQL 17 reset applied all five migrations successfully. Local schema lint passed and
the pgTAP production-security suite passed all 18 assertions. These local checks do not replace the
required hosted two-user test.

## Release decision

PR #10 must remain a Draft and must not be merged into `develop` yet. The minimum unblock sequence is:

1. Rotate and revoke the previously disclosed Supabase privileged secret, then update secret stores.
2. Apply the three missing forward-only migrations to the linked non-production project.
3. Repeat migration inspection, linked lint, Advisors, grant review, and two-user isolation testing.
4. Complete the remaining browser-console, responsive, keyboard, and screen-reader checks against the protected Preview.
5. Run HTTPS demo, auth, Gmail, and OpenAI smoke tests with disposable provider accounts.
6. Record the deployment URL and evidence, then mark PR #10 ready only if every release blocker passes.
