# Contributing to Inb0x Labs

Inb0x is an active, founder-led SaaS project. Contributions and AI-generated patches must meet the same review standards. The founder retains approval of product scope, security decisions, dependencies, releases and merges.

## Before changing code

Read [PROJECT_RULES.md](PROJECT_RULES.md), [AGENTS.md](AGENTS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/OWNERSHIP.md](docs/OWNERSHIP.md). For frontend work, also read [DESIGN_RULES.md](DESIGN_RULES.md) and [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md).

The founder explicitly requested solo development on one branch, main, on 12 October 2026. Keep work scoped on main and preserve history. Do not create new feature branches or PR stacks unless requested. Never force push. Local main commits are authorized; publishing main may trigger Production and needs separate release authorization beyond the current Preview-only permission.

## Workflow

```bash
git fetch origin
git switch main
git status --short
npm ci
npm run check
```

Review the current branch, uncommitted files, active pull requests and relevant ownership notes first. The baseline may already be failing; record actual results rather than resetting unrelated work. Avoid unrelated refactors. Use Conventional Commits such as `feat(inbox): show evidence source`, `fix(tasks): preserve duplicate state`, `docs: refresh release guidance`.

## Required PR evidence

- [ ] Scope and rationale are clear; dependencies and affected routes are listed.
- [ ] No unrequested business-logic, API contract or migration change.
- [ ] No Gmail write scopes, send/draft endpoints, background analysis or silent task acceptance.
- [ ] New UI covers loading, empty, error, partial-data and demo states.
- [ ] Keyboard, reduced-motion, responsive and text-only email rendering were reviewed where relevant.
- [ ] Tests cover behavior and regressions; `npm run check` results are recorded accurately.
- [ ] Secret and diff review completed; no personal mailbox data, screenshots with PII or local artifacts committed.
- [ ] Work is consolidated on main as requested; the founder authorizes publication and any Production deployment separately.

## External contributions and security

Open ordinary defects using GitHub issue templates. Send vulnerability details through the private channel in [SECURITY.md](SECURITY.md), never a public issue. Do not run destructive tests, use third-party Gmail accounts, deploy paid services or expose credentials without authorization.

MIT is the license in the repository today. Do not describe this source as proprietary unless the owner changes licensing intentionally and addresses previous grants.
