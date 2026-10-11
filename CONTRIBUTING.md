# Contributing to Inb0x Labs

Inb0x is an active, founder-led SaaS project. Contributions and AI-generated patches must meet the same review standards. The founder retains approval of product scope, security decisions, dependencies, releases and merges.

## Before changing code

Read [PROJECT_RULES.md](PROJECT_RULES.md), [AGENTS.md](AGENTS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/OWNERSHIP.md](docs/OWNERSHIP.md). For frontend work, also read [DESIGN_RULES.md](DESIGN_RULES.md) and [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md).

Use \`develop\` for integration, \`main\` for approved stable/release states. Make focused \`feat/*\`, \`fix/*\`, \`docs/*\`, \`test/*\`, \`refactor/*\` or \`chore/*\` branches. Never commit directly to \`main\` or \`develop\`, force-push shared history, or merge an agent's own PR.

## Workflow

\`\`\`bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feat/short-description
npm ci
npm run check
\`\`\`

Review the current branch, uncommitted files, active pull requests and relevant ownership notes first. The baseline may already be failing; record actual results rather than resetting unrelated work. Avoid unrelated refactors. Use Conventional Commits such as \`feat(inbox): show evidence source\`, \`fix(tasks): preserve duplicate state\`, \`docs: refresh release guidance\`.

## Required PR evidence

- [ ] Scope and rationale are clear; dependencies and affected routes are listed.
- [ ] No unrequested business-logic, API contract or migration change.
- [ ] No Gmail write scopes, send/draft endpoints, background analysis or silent task acceptance.
- [ ] New UI covers loading, empty, error, partial-data and demo states.
- [ ] Keyboard, reduced-motion, responsive and text-only email rendering were reviewed where relevant.
- [ ] Tests cover behavior and regressions; \`npm run check\` results are recorded accurately.
- [ ] Secret and diff review completed; no personal mailbox data, screenshots with PII or local artifacts committed.
- [ ] A draft PR targets \`develop\`; the founder makes the merge and release decisions.

## External contributions and security

Open ordinary defects using GitHub issue templates. Send vulnerability details through the private channel in [SECURITY.md](SECURITY.md), never a public issue. Do not run destructive tests, use third-party Gmail accounts, deploy paid services or expose credentials without authorization.

MIT is the license in the repository today. Do not describe this source as proprietary unless the owner changes licensing intentionally and addresses previous grants.
