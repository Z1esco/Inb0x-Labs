# Inb0x Labs · Startup roadmap

**Status:** Planning, 11 October 2026. This is a founder-controlled delivery plan, not a claim that the product is launched.

## Stage 0: Repository and product truth

- Keep main stable and develop as the application integration branch.
- Reconcile outdated two-person/hackathon documentation; maintain one definitive solo-founder workflow.
- Verify MIT licensing intent before any change. Public source is not automatically proprietary.
- Keep README, security, deployment status and supported features factual.
- Gate: documentation PR reviewed, no behavior changes, no secret exposure.

## Stage 1: Premium product experience

- Revisit the approved attention workbench local specimen and the prepared premium concept.
- Resolve conflict between dark DESIGN_RULES.md and old light docs/DESIGN_SYSTEM.md before implementation.
- Rebuild shell, dashboard, inbox, thread evidence inspector, accepted tasks, copy-only drafts, insights, settings, landing and login.
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

Every milestone should define user problem, scope, API impact, trust boundary, test evidence, rollback, and manual verification. Avoid fake traction, unverified marketing claims and vanity features. Keep work small enough to review as independent PRs.

See [CODEX_HANDOFF.md](CODEX_HANDOFF.md) and [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).
