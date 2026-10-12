# Production stabilization candidate

Base: cda3eff200818fddc567c517f8161f5395246096. Working branch:
`codex/production-stabilization`. Preserve the approved marketing design and deployed
Production artifact. The current request supersedes older main-only development rules.

1. Audit source, local/remote history, CI, live GET routes, DNS, Vercel environment
   names and non-secret values, and Supabase security metadata without changing hosted state.
2. Reproduce and fix canonical Google identity scopes, rejected extra permissions,
   safe sign-in callback failures/demo behavior, and expired rate-limit bucket retention.
3. Pin the tested Node major (22.x), align CI, add branch CI coverage and document
   the approval-gated main recovery and release/rollback workflow.
4. Add compatible CSP directives and public canonical/robots/sitemap metadata;
   keep private/demo routes and Preview deployments out of search indexing.
5. Review install hooks; install with scripts disabled, run format/lint/typecheck,
   unit/integration tests, optimized build, security/dependency checks and full E2E.
6. Compare seven-size screenshots and measure a local production-build baseline
   against the candidate. Never claim field Web Vitals or live-provider success.
7. Commit/push this Preview branch, open draft release/recovery PRs, and deliver a
   PASS/PARTIAL/BLOCKED/NOT TESTED matrix plus exact owner actions. No merge or promotion.

Hosted database metadata is read-only. No user-row queries, test-account creation,
migrations, key disclosure, DNS edits, billing changes or paid API traffic. The Inb0x
project is dsohdhwjzsxuppjbynxs; Spenza is outside scope and must not be queried or changed.
