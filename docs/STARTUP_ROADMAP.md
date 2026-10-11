# Inb0x Labs · Startup roadmap

**Status:** Solo developer, main only, confirmed 12 October 2026. Previous candidate history is consolidated locally on main; older draft PRs remain historical and unmerged. The V2 product experience is recorded in V2_FRONTEND_PLAN.md. This is not a launched product.

## Stage 0: Repository and product truth

- Use main as the only current development branch, per the founder's latest instruction. Publishing main is a separately authorized Production action.
- Reconcile outdated two-person/hackathon documentation; maintain one definitive solo-founder workflow.
- Verify MIT licensing intent before any change. Public source is not automatically proprietary.
- Keep README, security, deployment status and supported features factual.
- Gate: solo workflow documented, changes scoped, no secret exposure.

## Stage 1: Premium product experience

- Implemented on the candidate: dark design authority, shared shell and every existing route, including source links, explicit analysis and reply transparency.
- Historical PR #12 reviewed; original HTML specimen unavailable. Conflicting light design documentation reconciled with DESIGN_RULES.md.
- Keep existing shell, dashboard, inbox, thread evidence, accepted tasks, copy-only replies, insights, settings, landing and login coherent as features evolve.
- Use existing APIs and contracts. No Gmail write scopes, background analysis, automatic task acceptance or invented data.
- Gate: responsive visual QA at 360, 390, 768, 1024, 1280, 1440 and 1920 widths; keyboard, screen-reader, reduced-motion and demo journey regressions.

## Stage 2: Production-readiness evidence

- Baseline formatting, ESLint, strict typing, tests, build, Playwright, dependency audit and secret scan.
- Validate OAuth with an authorized dedicated test mailbox, read-only Gmail permissions and consent requirements.
- Verify hosted Supabase RLS using two synthetic users, migration status, encryption/token handling and account deletion.
- Confirm usage limits, cost ceilings, privacy/terms, incident response and rollback.
- Gate: verified evidence, no critical unresolved security issues; founder approval.

## Acquired domain (not a deployment claim)

- `inb0x.my` was acquired from Exabytes and is intended as the canonical product domain.
- Follow [DOMAIN_DEPLOYMENT.md](DOMAIN_DEPLOYMENT.md) for nameserver/DNS ownership, Vercel project records, SSL and OAuth callbacks. Avoid overwriting existing email DNS records.
- Vercel Hobby is restricted to non-commercial personal use; assess an eligible hosting plan before commercial operation.

## Stage 3: Controlled beta

- Deploy a demo first with an eligible hosting provider and no real user data; verify `inb0x.my` only when a deployment is approved.
- Set up actual environment, monitored usage, provider configuration and callback URLs separately.
- Run a limited opt-in beta with deliberate privacy disclosures and a recovery path.
- Gate: authorized real-world tests and clear support/feedback channel.

## Stage 4: Commercial learning

- Interview potential users, measure weekly useful decisions and retained users, and validate willingness to pay.
- Do not add subscriptions or a billing provider until actual demand is demonstrated and legal/tax treatment is decided.
- Prioritize reliability, clarity and trust over autonomous email actions.

## Backlog discipline

Every milestone should define user problem, scope, API impact, trust boundary, test evidence, rollback, and manual verification. Avoid fake traction, unverified marketing claims and vanity features. Keep changes small enough to review and verify on main.

See [CODEX_HANDOFF.md](CODEX_HANDOFF.md) and [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).
