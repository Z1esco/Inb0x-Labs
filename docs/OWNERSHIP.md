# Ownership and AI development workflow

**Operating model (11 October 2026): Solo founder + coding agents.** Older documents referring to a technical lead and a frontend partner describe a previous collaboration model. They are not a current division of approval authority.

## Accountable owner

The founder is accountable for the product strategy, user experience approval, architecture, security, Gmail scope, Supabase authorization, AI spending, secrets, legal/privacy setup, GitHub merges and production releases.

Codex and other AI agents are implementation assistants. They may read, research, propose diffs, implement scoped work and run checks, but may not independently approve dangerous migrations, secrets disclosure, new Gmail permissions, paid infrastructure, deployments or release claims.

## Logical areas (not human owners)

| Area | Paths / guardrails |
| --- | --- |
| Backend and security | `src/app/api/**`, `src/server/**`, `src/lib/**`, `src/schemas/**`, `src/prompts/**`, `src/types/**`, `supabase/**` |
| Frontend and design | `src/components/**`, `src/features/**`, `src/styles/**`, `public/**`, visual routes and `src/app/globals.css` |
| Shared contracts and handoffs | `src/types/contracts.ts`, `src/mock/**`, `src/lib/api-client.ts`, layouts, `docs/**`, `README.md` |

These are **review boundaries**, not ownership restrictions on the founder. An agent should not mix unrelated areas in the same PR. Backend changes must not silently overwrite a design pass; frontend changes must not change the API contract for visual convenience.

## Branches and release gates

- `main`: stable baseline/release branch; currently behind `develop` and not evidence of an approved production launch.
- `develop`: source integration branch for the application.
- `feat/*`, `fix/*`, `docs/*`: short-lived focused branches from the correct dependency.
- Draft PRs require founder review and recorded validation. No autonomous merge or main deployment.
- Before a public beta: demo validation, cross-user isolation, hosted OAuth/scope review, billing limits, security and privacy checks, deployment and rollback rehearsals.

For Codex-specific starting instructions use [CODEX_HANDOFF.md](CODEX_HANDOFF.md) and the priorities in [STARTUP_ROADMAP.md](STARTUP_ROADMAP.md).
