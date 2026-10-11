# Ownership and AI development workflow

**Operating model (confirmed 12 October 2026): Solo developer + coding agents, one branch: main.** The founder explicitly superseded the V2 brief's two-developer workflow: “use main only, im a solo dev, dont separate anything. use one branch”. Backend and frontend remain code boundaries, not separate human owners or delivery branches.

## Accountable owner

The founder is accountable for the product strategy, user experience approval, architecture, security, Gmail scope, Supabase authorization, AI spending, secrets, legal/privacy setup, GitHub merges and production releases.

Codex and other AI agents are implementation assistants. They may read, research, propose diffs, implement scoped work and run checks, but may not independently approve dangerous migrations, secrets disclosure, new Gmail permissions, paid infrastructure, deployments or release claims.

## Logical areas (not human owners)

| Area                          | Paths / guardrails                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Backend and security          | `src/app/api/**`, `src/server/**`, `src/lib/**`, `src/schemas/**`, `src/prompts/**`, `src/types/**`, `supabase/**` |
| Frontend and design           | `src/components/**`, `src/features/**`, `src/styles/**`, `public/**`, visual routes and `src/app/globals.css`      |
| Shared contracts and handoffs | `src/types/contracts.ts`, `src/mock/**`, `src/lib/api-client.ts`, layouts, `docs/**`, `README.md`                  |

These are **review boundaries**, not ownership restrictions on the founder. An agent should not mix unrelated areas in the same PR. Backend changes must not silently overwrite a design pass; frontend changes must not change the API contract for visual convenience.

## Branches and release gates

- `main`: the single current development branch. Local main includes the previous candidate history; this does not establish a production launch.
- `develop`, feature branches and PRs #16–20: retained historical work. Do not force-update, close or delete remote history as a side effect.
- No new feature branches or PRs unless the founder requests them.
- Run checks and preserve a reviewable diff before local commits. Publishing main may trigger Production; Preview-only authorization does not authorize that release.
- Before a public beta: demo validation, cross-user isolation, hosted OAuth/scope review, billing limits, security and privacy checks, deployment and rollback rehearsals.

For Codex-specific starting instructions use [CODEX_HANDOFF.md](CODEX_HANDOFF.md) and the priorities in [STARTUP_ROADMAP.md](STARTUP_ROADMAP.md).
